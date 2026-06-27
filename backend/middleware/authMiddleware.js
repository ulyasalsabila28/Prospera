const passport = require('passport');

/**
 * Middleware Verifikasi Token JWT
 * Memvalidasi keaslian token (via HttpOnly Cookie) menggunakan Passport-JWT,
 * memeriksa BlacklistedTokens, dan menyimpan data pengguna ke req.user
 */
const verifyToken = (req, res, next) => {
    // Gunakan custom callback Passport agar kita bisa menangani error secara manual
    // dan menyuntikkan store_id ke objek req.user
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        
        // Jika tidak ada user (misal token kadaluwarsa, tidak ada cookie, atau masuk blacklist)
        if (!user) {
            const message = info && info.message ? info.message : "Sesi Anda telah habis atau tidak valid. Silakan login kembali.";
            return res.status(401).json({ message });
        }
        
        // FIX (CRITICAL-05): Normalisasi role ke lowercase untuk memastikan
        // authorizeRole('owner') selalu cocok terlepas dari casing di JWT payload.
        // User yang didapat dari passport adalah instance Sequelize
        const userId = user.user_id;
        const userRole = user.role ? user.role.toLowerCase() : 'owner';
        
        // Karena object Sequelize, kita bisa menambah properti custom (sebaiknya gunakan dataValues atau assign langsung)
        user.role = userRole;
        user.store_id = userRole === 'owner' ? userId : (user.owner_id || userId);
        
        // Simpan ke request
        req.user = user;
        next();
    })(req, res, next);
};

module.exports = verifyToken;