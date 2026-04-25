const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi untuk mendaftarkan pengguna baru ke dalam sistem
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Memvalidasi masukan agar tidak ada data yang kosong
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Semua kolom (username, email, password) wajib diisi!" });
        }

        // Memeriksa apakah alamat email sudah terdaftar di dalam basis data
        const existingUser = await User.findOne({ 
            where: { email: email } 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: "Email tersebut sudah terdaftar." });
        }

        // Melakukan proses hashing pada kata sandi untuk keamanan data
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Menyimpan data pengguna baru ke dalam tabel Users
        const newUser = await User.create({
            username: username,
            email: email,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: "Akun berhasil dibuat.", 
            userId: newUser.user_id 
        });

    } catch (error) {
        console.error("Kesalahan pada proses registrasi:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Fungsi untuk menghapus data pengguna dari basis data secara permanen
const deleteUser = async (req, res) => {
    try {
        // Mengambil ID pengguna dari token otentikasi yang sedang aktif
        const idTarget = req.user.id; 

        // Menjalankan perintah penghapusan data berdasarkan ID pengguna
        const deletedRows = await User.destroy({
            where: { user_id: idTarget }
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        res.status(200).json({ message: "Data pengguna berhasil dihapus secara permanen." });

    } catch (error) {
        console.error("Kesalahan pada proses penghapusan pengguna:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Fungsi untuk mengautentikasi pengguna dan memberikan token akses
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Mencari data pengguna berdasarkan alamat email
        const user = await User.findOne({ 
            where: { email: email } 
        });
        
        if (!user) {
            return res.status(404).json({ message: "Email tidak terdaftar." });
        }

        // Memverifikasi kecocokan antara kata sandi masukan dan kata sandi di basis data
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Kata sandi yang Anda masukkan salah." });
        }

        // Menghasilkan token JWT apabila autentikasi dinyatakan berhasil
        const token = jwt.sign(
            { id: user.user_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Mengirimkan token beserta informasi dasar pengguna sebagai respons
        res.status(200).json({
            message: "Login berhasil.",
            token: token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Kesalahan pada proses login:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

module.exports = { register, deleteUser, login };