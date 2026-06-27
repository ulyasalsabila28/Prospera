const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const bcrypt = require('bcryptjs');
const { User, BlacklistedToken } = require('../models');

// Extract JWT dari Cookie, bukan dari Header (Mitigasi XSS)
const cookieExtractor = function(req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
};

// 1. Local Strategy (Untuk Login Endpoint)
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return done(null, false, { message: 'Email atau kata sandi yang Anda masukkan salah.' });
        }

        if (!user.is_active) {
            return done(null, false, { message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Owner.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Email atau kata sandi yang Anda masukkan salah.' });
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// 2. JWT Strategy (Untuk Protected Routes)
const jwtOptions = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
        // Cek JWT ID (jti) di BlacklistedTokens untuk Ghost Token Prevention
        if (jwtPayload.jti) {
            const isBlacklisted = await BlacklistedToken.findOne({ where: { jti: jwtPayload.jti } });
            if (isBlacklisted) {
                return done(null, false, { message: 'Sesi telah kedaluwarsa atau ditarik (Token Blacklisted).' });
            }
        }

        // Cari user yang login
        const user = await User.findByPk(jwtPayload.id);
        if (!user || !user.is_active) {
            return done(null, false);
        }

        // Pass payload + full user info (menghindari query lagi di auth controller if not needed,
        // tapi jwtPayload sudah di verify. Kita return instance DB user)
        return done(null, user, jwtPayload);
    } catch (error) {
        return done(error, false);
    }
}));

module.exports = passport;
