const { User, BlacklistedToken } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_EXPIRY } = require('../config/appConfig');
// FIX (HIGH-01): Import utilitas masking data pribadi (UU PDP — Data Minimization)
const { maskEmail } = require('../utils/privacy');
// FIX (HIGH-02): Import Hard Purge Service untuk Right to be Forgotten (UU PDP)
const { hardPurgeStore } = require('../services/purgeService');

/**
 * Register — Pendaftaran publik untuk UMKM / Toko Baru
 * Siapapun yang mendaftar melalui endpoint ini akan otomatis menjadi 'owner'.
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password, phone_number } = req.body;

        // Cek duplikasi email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email tersebut sudah terdaftar." });
        }

        // Cek duplikasi no hp
        if (phone_number) {
            const existingPhone = await User.findOne({ where: { phone_number } });
            if (existingPhone) {
                return res.status(409).json({ message: "Nomor handphone tersebut sudah terdaftar." });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat akun Owner pertama
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            phone_number: phone_number || null,
            role: 'owner'  // Pendaftar pertama SELALU jadi Owner
        });

        res.status(201).json({ 
            message: "Akun Owner berhasil dibuat. Silakan login.", 
            userId: newUser.user_id 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login — Autentikasi pengguna dan pemberian token JWT
 * Rute ini di-intercept oleh passport.authenticate('local') di authRoutes.js
 * sehingga kredensial telah divalidasi dan `req.user` sudah terisi.
 */
const login = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Autentikasi gagal." });
        }

        // Generate JTI (UUID) untuk Ghost Token Prevention
        const jti = crypto.randomUUID();

        // JWT payload kini menyertakan JTI, ROLE dan OWNER_ID untuk multi-tenant
        const token = jwt.sign(
            { jti: jti, id: user.user_id, email: user.email, role: user.role, owner_id: user.owner_id },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Injeksi JWT ke dalam HttpOnly Cookie (Anti-XSS & Anti-CSRF)
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax', // Cross-port CSRF protection
            maxAge: 24 * 60 * 60 * 1000 // 1 Hari
        });

        res.status(200).json({
            message: "Login berhasil.",
            user: {
                id: user.user_id,
                username: user.username,
                // FIX (HIGH-01): Email di-mask sebelum dikirim ke browser (UU PDP)
                email: maskEmail(user.email),
                role: user.role,
                has_completed_tour: user.has_completed_tour
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout — Menarik JWT dan memasukkan JTI ke Blacklist
 */
const logout = async (req, res, next) => {
    try {
        const token = req.cookies && req.cookies['jwt'];
        if (token) {
            try {
                // Decode token tanpa verifikasi signature untuk mendapatkan JTI dan EXP
                const decoded = jwt.decode(token);
                if (decoded && decoded.jti && decoded.exp) {
                    await BlacklistedToken.create({
                        jti: decoded.jti,
                        expires_at: new Date(decoded.exp * 1000)
                    });
                }
            } catch (err) {
                console.error("Gagal blacklist token saat logout:", err.message);
            }
        }

        // Hapus jendela waktu lembur agar tidak diwariskan ke sesi berikutnya
        if (req.user && (req.user.id || req.user.user_id)) {
            const userId = req.user.id || req.user.user_id;
            await User.update(
                { overtime_unlocked_until: null },
                { where: { user_id: userId } }
            );
        }

        // Hancurkan cookie di browser klien
        res.clearCookie('jwt');
        res.status(200).json({ message: "Berhasil keluar (Sesi dihapus mutlak)." });
    } catch (error) {
        next(error);
    }
};

/**
 * Me — Session Hydration (Anti F5 Amnesia)
 * Endpoint ini dilindungi oleh passport.authenticate('jwt').
 * Jika sukses, mengembalikan profil user yang sedang aktif.
 */
const me = async (req, res, next) => {
    try {
        const user = req.user;
        res.status(200).json({
            user: {
                id: user.user_id,
                username: user.username,
                email: maskEmail(user.email),
                role: user.role,
                has_completed_tour: user.has_completed_tour
            }
        });
    } catch (error) {
        next(error);
    }
};

// ===================== USER MANAGEMENT (Owner Only) =====================

/**
 * createUser — Owner membuat akun Karyawan baru
 * Endpoint ini HANYA bisa diakses oleh Owner (dilindungi authorizeRole di route).
 */
const createUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // Hanya boleh membuat akun 'karyawan' (Owner tidak bisa membuat Owner lain)
        const assignedRole = 'karyawan';

        // Cek duplikasi email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email tersebut sudah digunakan." });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: assignedRole,
            // FIX: Gunakan req.user.user_id yang terdekripsi dari JWT
            owner_id: req.user.user_id // SaaS ISOLATION: Karyawan ini milik Owner yang sedang login
        });

        res.status(201).json({ 
            message: `Akun ${assignedRole} "${username}" berhasil dibuat.`,
            user: {
                id: newUser.user_id,
                username: newUser.username,
                // FIX (HIGH-01): Email di-mask (UU PDP)
                email: maskEmail(newUser.email),
                role: newUser.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * getAllUsers — Owner melihat daftar semua user
 */
const getAllUsers = async (req, res, next) => {
    try {
        // SaaS ISOLATION: Hanya tampilkan karyawan milik Owner ini
        // FIX: Gunakan req.user.user_id untuk query owner_id
        const users = await User.findAll({
            where: { owner_id: req.user.user_id },
            attributes: ['user_id', 'username', 'email', 'role', 'is_active'],
            order: [['user_id', 'ASC']]
        });

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

/**
 * deleteUserById — Owner menghapus akun Karyawan
 * Owner TIDAK bisa menghapus dirinya sendiri.
 * SECURITY: Filter by owner_id untuk mencegah IDOR (cross-tenant deletion).
 */
const deleteUserById = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user.user_id;

        // Cegah Owner menghapus diri sendiri
        if (targetId === currentUserId) {
            return res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri." });
        }

        // SECURITY FIX (B-T03): Cari user target HANYA dalam lingkup toko Owner ini
        // Sebelumnya: User.findByPk(targetId) — bisa mengakses user milik toko lain
        const targetUser = await User.findOne({
            where: {
                user_id: targetId,
                owner_id: req.user.user_id  // Isolasi tenant: hanya karyawan milik Owner ini
            }
        });

        if (!targetUser) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Cegah menghapus Owner lain (lapisan pertahanan tambahan)
        if (targetUser.role === 'owner') {
            return res.status(403).json({ message: "Tidak dapat menghapus akun Owner." });
        }

        // SOFT DELETE: Set is_active = false untuk menjaga riwayat transaksi
        await targetUser.update({ is_active: false });

        res.status(200).json({ message: `Akun "${targetUser.username}" berhasil dinonaktifkan.` });
    } catch (error) {
        next(error);
    }
};

/**
 * updateUserById — Owner mengedit data Karyawan (Username & Email saja)
 */
const updateUserById = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const { username, email } = req.body;

        const targetUser = await User.findOne({
            where: {
                user_id: targetId,
                owner_id: req.user.user_id
            }
        });

        if (!targetUser) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        if (targetUser.role === 'owner') {
            return res.status(403).json({ message: "Tidak dapat mengedit akun Owner melalui rute ini." });
        }

        if (email && email !== targetUser.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(409).json({ message: "Email tersebut sudah digunakan." });
            }
        }

        await targetUser.update({
            username: username || targetUser.username,
            email: email || targetUser.email
        });

        res.status(200).json({ message: `Akun "${targetUser.username}" berhasil diperbarui.` });
    } catch (error) {
        next(error);
    }
};

/**
 * resetUserPasswordById — Owner mereset password Karyawan
 */
const resetUserPasswordById = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password minimal 6 karakter." });
        }

        const targetUser = await User.findOne({
            where: {
                user_id: targetId,
                owner_id: req.user.user_id
            }
        });

        if (!targetUser) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        if (targetUser.role === 'owner') {
            return res.status(403).json({ message: "Tidak dapat mereset password Owner." });
        }

        if (!targetUser.is_active) {
            return res.status(403).json({ message: "Tidak dapat mereset password akun nonaktif." });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await targetUser.update({ password: hashedPassword });

        res.status(200).json({ message: `Password untuk "${targetUser.username}" berhasil direset.` });
    } catch (error) {
        next(error);
    }
};

/**
 * deleteUser — User (Owner) menghapus seluruh akun dan data toko mereka
 * FIX (HIGH-02): Ganti cascade cleanup yang tidak lengkap dengan hardPurgeStore().
 * - SEBELUM: Hanya Product yang di-hard delete, data lain (Transaction, InventoryLog, dll) tertinggal
 * - SESUDAH: hardPurgeStore() menyapu BERSIH semua data dalam 1 transaksi ACID
 *   sesuai hak 'Right to be Forgotten' UU PDP Pasal 35.
 */
const deleteUser = async (req, res, next) => {
    try {
        const idTarget = req.user.user_id;
        const user = await User.findByPk(idTarget);

        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Hanya Owner yang berhak menghapus seluruh akun toko via endpoint ini
        // Karyawan menggunakan endpoint terpisah (dihapus oleh Owner)
        if (user.role !== 'owner') {
            return res.status(403).json({ message: "Hanya Owner yang dapat menghapus akun toko secara permanen." });
        }

        // FIX (HIGH-02): Panggil Hard Purge Service — satu fungsi ACID yang menghapus
        // semua data toko dalam urutan yang aman sesuai foreign key constraint.
        // Tidak ada lagi pengecekan jumlah karyawan karena purgeService menangani semuanya.
        const { sequelize } = require('../models');
        const models = require('../models');
        const purgeResult = await hardPurgeStore(sequelize, models, idTarget);

        res.status(200).json({ 
            message: "Seluruh data akun toko Anda telah dihapus secara permanen sesuai hak Right to be Forgotten.",
            purgedAt: purgeResult.purgedAt,
            summary: purgeResult.summary
        });
    } catch (error) {
        next(error);
    }
};

/**
 * changePassword — User (Owner/Karyawan) mengganti password mereka sendiri
 */
const changePassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        const userId = req.user.user_id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Verifikasi password lama
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password lama tidak sesuai." });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update database
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password berhasil diubah." });
    } catch (error) {
        next(error);
    }
};

const markTourComplete = async (req, res, next) => {
    try {
        const userId = req.user.user_id; // Fix: Gunakan user_id dari model Sequelize
        await User.update({ has_completed_tour: true }, { where: { user_id: userId } });
        res.status(200).json({ message: "Tour completed state updated successfully." });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    logout,
    me,
    createUser,
    getAllUsers,
    deleteUser,
    deleteUserById,
    updateUserById,
    resetUserPasswordById,
    changePassword,
    markTourComplete
};