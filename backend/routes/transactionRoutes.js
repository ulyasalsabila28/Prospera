const express = require('express');
const router = express.Router();

// Import Middleware 
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { validateTransaction } = require('../middleware/validationMiddleware');
const { checkTimeAccess } = require('../middleware/timeAccessControl');
const { exportLimiter } = require('../middleware/rateLimiter');

// Import fungsi dari Controller
const { createTransaction, getTransactionHistory, exportTransactionHistory, getTransactionSummary, unlockOvertime } = require('../controllers/transactionController');

// SECURITY FIX (B-S23): Terapkan RBAC ketat pada endpoint transaksi
// Hanya role 'owner' dan 'karyawan' yang diizinkan — mencegah role tak terduga mengakses endpoint ini
router.post('/checkout', verifyToken, authorizeRole('owner', 'karyawan'), checkTimeAccess, validateTransaction, createTransaction);
router.post('/unlock-overtime', verifyToken, authorizeRole('owner', 'karyawan'), unlockOvertime);
router.get('/history', verifyToken, authorizeRole('owner', 'karyawan'), getTransactionHistory);
router.get('/export', verifyToken, exportLimiter, authorizeRole('owner', 'karyawan'), exportTransactionHistory);
router.get('/summary', verifyToken, authorizeRole('owner', 'karyawan'), getTransactionSummary);

module.exports = router;