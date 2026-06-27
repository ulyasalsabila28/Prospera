const express = require('express');
const router = express.Router();
const passport = require('passport');

// Import Middleware
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validationMiddleware');

// Import fungsi dari Controller
const { register, login, logout, me, createUser, getAllUsers, deleteUserById, updateUserById, resetUserPasswordById, deleteUser, changePassword, markTourComplete } = require('../controllers/authController');

// === RUTE PUBLIK (Rate Limited) ===

// Registrasi Owner pertama (tertutup otomatis setelah ada 1 user)
router.post('/register', authLimiter, validateRegister, register);

// Login (Passport Local Strategy meng-intercept dan memverifikasi email+password)
router.post('/login', authLimiter, validateLogin, passport.authenticate('local', { session: false }), login);

// Logout
router.post('/logout', verifyToken, logout);

// Me (Session Hydration)
router.get('/me', verifyToken, me);

// === RUTE USER MANAGEMENT (Owner Only) ===

// Owner melihat daftar semua user
router.get('/users', verifyToken, authorizeRole('owner'), getAllUsers);

// Owner membuat akun Karyawan baru
router.post('/users', verifyToken, authorizeRole('owner'), validateRegister, createUser);

// Owner menghapus akun Karyawan
router.delete('/users/:id', verifyToken, authorizeRole('owner'), deleteUserById);

// Owner mengedit akun Karyawan
router.put('/users/:id', verifyToken, authorizeRole('owner'), updateUserById);

// Owner mereset password Karyawan
router.put('/users/:id/reset-password', verifyToken, authorizeRole('owner'), resetUserPasswordById);

// === RUTE SELF-SERVICE ===

// User menghapus akun sendiri
router.delete('/delete', verifyToken, deleteUser);

// User mengganti password
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

// User menyelesaikan tour
router.put('/complete-tour', verifyToken, markTourComplete);

module.exports = router;