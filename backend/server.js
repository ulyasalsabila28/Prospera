require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const { sequelize } = require('./models');
const { apiLimiter } = require('./middleware/rateLimiter');
const { CORS_ORIGIN, BODY_SIZE_LIMIT } = require('./config/appConfig');
// FIX (HIGH-04): Request/Correlation ID Middleware untuk observability enterprise
const requestId = require('./middleware/requestId');
// FIX (MEDIUM-14): Structured Logging — ganti raw console.log dengan logger terstruktur
const logger = require('./utils/logger');

// --- Fail-fast: Validasi konfigurasi kritis sebelum server berjalan ---
if (!process.env.JWT_SECRET) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET belum dikonfigurasi di file .env!');
    console.error('   Server tidak dapat berjalan tanpa kunci rahasia JWT.\n');
    process.exit(1);
}

// SECURITY FIX (B-T01): Tolak JWT_SECRET yang terlalu lemah/pendek
// Minimum 32 karakter (128-bit entropy) untuk mencegah brute-force
if (process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET terlalu lemah! Minimal 32 karakter.');
    console.error('   Generate secret baru: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    process.exit(1);
}

const app = express();

// FIX (V6.0): Reverse Proxy Suicide Prevention
// Harus diset SEBELUM express-rate-limit agar IP terbaca sebagai IP Klien asli (via X-Forwarded-For)
// bukan sebagai IP Cloudflare/Nginx Load Balancer tunggal.
app.set('trust proxy', 1);

// ===== LAPISAN KEAMANAN (Security Middleware Stack) =====

// Layer 0: Request ID — Inject X-Request-Id ke setiap request untuk tracing & observability
app.use(requestId);

// FIX (MEDIUM-14): HTTP Request Logger — log setiap request dengan structured JSON
// Di production ini memudahkan monitoring dan alerting
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        // Jangan log health-check endpoint agar tidak flooding log
        if (req.originalUrl !== '/') {
            logger.http(req, res.statusCode, Date.now() - start);
        }
    });
    next();
});

// Layer 1: Helmet — Menyembunyikan identitas server & mencegah serangan injeksi header
app.use(helmet());

// Layer 1.5: Compression — Mengompresi response (Gzip/Brotli) untuk performa
app.use(compression());

// Layer 2: Cookie Parser — Mengekstrak HttpOnly cookies dari request
app.use(cookieParser());

// Layer 3: CORS — Membatasi akses hanya dari origin yang diizinkan
// FIX (CRIT-04): Tambahkan 'X-Idempotency-Key' ke allowedHeaders.
// Tanpa ini, browser CORS preflight memblokir header kustom sebelum mencapai
// controller, sehingga sistem anti-transaksi-duplikat di transactionController.js
// (Line 35: req.headers['x-idempotency-key']) tidak pernah berfungsi.
// X-Request-ID ditambahkan juga agar frontend bisa membaca requestId dari error response.
app.use(cors({
    origin: typeof CORS_ORIGIN === 'string' ? [CORS_ORIGIN, 'http://127.0.0.1:5173'] : CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'], // Izinkan frontend membaca header ini dari response
    credentials: true // FIX (V4.0): Wajib aktif agar frontend bisa mengirim dan menerima HttpOnly Cookie
}));

// Layer 3: Rate Limiter Global — Anti DDoS untuk seluruh endpoint API
app.use('/api', apiLimiter);

// Layer 4: Body Parser — Membatasi ukuran payload untuk mencegah serangan payload besar
app.use(express.json({ limit: BODY_SIZE_LIMIT }));

// Layer 5: Passport — Inisialisasi strategi autentikasi
const passport = require('./config/passport');
app.use(passport.initialize());

// ===== RUTE APLIKASI =====

// Mengimpor rute aplikasi
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const storeSettingRoutes = require('./routes/storeSettingRoutes');
const smartFeatureRoutes = require('./routes/smartFeatureRoutes');

// Mendaftarkan rute antarmuka pemrograman aplikasi ke dalam server
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/store-settings', storeSettingRoutes);
app.use('/api/smart-features', smartFeatureRoutes);

// Rute pengujian server
app.get('/', (req, res) => {
    res.status(200).json({ message: "Server Backend Prospera berjalan dengan baik." });
});

// Swagger UI untuk dokumentasi OpenAPI
const swaggerSpec = require('./docs/Swagger Documentation Package/swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== PENANGANAN ERROR =====

// Penanganan Rute Tidak Ditemukan (404 Handler)
// SECURITY FIX (B-S02): Tidak lagi menampilkan req.originalUrl ke client (information disclosure)
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint yang Anda akses tidak tersedia." });
});

// Penanganan Kesalahan Global (500 Handler) — Sentral & Aman
// Menangkap semua error yang dilempar via next(error) dari Controller
app.use((err, req, res, next) => {
    // FIX (MEDIUM-14): Structured error log — parseable oleh monitoring tools
    logger.error('Unhandled server error', {
        requestId: req.requestId || 'N/A',
        route: `${req.method} ${req.originalUrl}`,
        message: err.message,
        stack: err.stack,
        isOperational: err.isOperational || false
    });

    // Kirim respons generik ke client (TIDAK membocorkan detail error)
    res.status(err.statusCode || 500).json({ 
        message: err.isOperational 
            ? err.message 
            : "Terjadi kesalahan internal sistem yang tidak terduga.",
        // RequestId dikembalikan agar frontend bisa report ke support
        requestId: req.requestId
    });
});

// ===== KONEKSI DATABASE & START SERVER =====

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        logger.info('Koneksi ke basis data MySQL (Sequelize) berhasil didirikan.');
        
        // Memulai Background Jobs (Cron)
        const { startCronJobs } = require('./jobs/cronJobs');
        startCronJobs();

        const server = app.listen(PORT, () => {
            logger.info(`Server Node.js aktif`, {
                port: PORT,
                corsOrigin: CORS_ORIGIN,
                bodyLimit: BODY_SIZE_LIMIT,
                nodeEnv: process.env.NODE_ENV || 'development'
            });
        });

        // PERFORMANCE FIX (B-S01): Graceful Shutdown
        // Memastikan koneksi DB ditutup dengan benar saat server dimatikan
        const gracefulShutdown = (signal) => {
            console.log(`\n⚠️  Sinyal ${signal} diterima. Memulai graceful shutdown...`);
            server.close(() => {
                console.log('✅ Server HTTP ditutup.');
                sequelize.close()
                    .then(() => {
                        console.log('✅ Koneksi database ditutup.');
                        process.exit(0);
                    })
                    .catch((err) => {
                        console.error('❌ Gagal menutup koneksi database:', err);
                        process.exit(1);
                    });
            });

            // Force shutdown setelah 10 detik jika graceful gagal
            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout. Force exit.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    })
    .catch((err) => {
        console.error('Gagal terhubung ke basis data:', err);
    });