/**
 * rateLimiter.js — Middleware Anti Brute-Force & DDoS
 * Menggunakan express-rate-limit untuk membatasi jumlah request per IP.
 */
const rateLimit = require('express-rate-limit');
const { AUTH_RATE_LIMIT, API_RATE_LIMIT } = require('../config/appConfig');

// Limiter ketat untuk endpoint autentikasi (login & register)
const authLimiter = rateLimit(AUTH_RATE_LIMIT);

// Limiter umum untuk seluruh endpoint API
const apiLimiter = rateLimit(API_RATE_LIMIT);

// Limiter sangat ketat untuk endpoint export CSV/Excel (DDoS / Denial of Wallet Protection)
const exportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 100, // Diperlonggar untuk keperluan testing/development
    message: { message: "Batas permintaan export tercapai. Silakan tunggu 1 menit sebelum mencoba lagi." }
});

module.exports = { authLimiter, apiLimiter, exportLimiter };
