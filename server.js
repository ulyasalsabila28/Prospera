require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Mengimpor koneksi Sequelize dari folder models (Menggantikan config/db lama)
const { sequelize } = require('./models'); 

const app = express();

// Konfigurasi middleware standar
app.use(cors()); 
app.use(express.json()); 

// 1. Mengimpor rute aplikasi
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// 2. Mendaftarkan rute antarmuka pemrograman aplikasi (API) ke dalam peladen (server)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);

// Rute pengujian peladen (Root)
app.get('/', (req, res) => {
    res.status(200).json({ message: "Server Backend Prospera berjalan dengan baik." });
});

// Penanganan Rute Tidak Ditemukan (404 Handler)
// Menangkap permintaan ke rute yang tidak terdaftar untuk memastikan respons tetap dalam format JSON
app.use((req, res) => {
    res.status(404).json({ message: `Rute ${req.originalUrl} tidak ditemukan pada server ini.` });
});

// Penanganan Kesalahan Global (Global Error Handler)
// Menangkap kesalahan sistem yang tidak terduga agar peladen tidak berhenti beroperasi secara paksa
app.use((err, req, res, next) => {
    console.error("Kesalahan Fatal Sistem:", err.stack);
    res.status(500).json({ message: "Terjadi kesalahan internal sistem yang tidak terduga." });
});

// Menjalankan peladen pada port yang telah dikonfigurasi
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('Koneksi ke basis data MySQL (Sequelize) berhasil didirikan.');
        app.listen(PORT, () => {
            console.log(`Server Node.js berjalan pada port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Gagal terhubung ke basis data:', err);
    });