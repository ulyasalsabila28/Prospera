const cron = require('node-cron');
const { Op } = require('sequelize');
const { BlacklistedToken } = require('../models');

/**
 * Sweeper DB Otomatis
 * Berjalan setiap hari pada jam 00:00 (Tengah malam)
 * Menghapus semua JTI token di tabel BlacklistedTokens yang sudah kedaluwarsa.
 * Menggunakan indeks `expires_at` untuk pembersihan cepat.
 */
const startCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[CRON] Memulai pembersihan token kedaluwarsa...');
            
            const deletedCount = await BlacklistedToken.destroy({
                where: {
                    expires_at: {
                        [Op.lt]: new Date()
                    }
                }
            });

            console.log(`[CRON] Pembersihan selesai. ${deletedCount} token lama telah dihapus dari blacklist.`);
        } catch (error) {
            console.error('[CRON] Gagal membersihkan token blacklist:', error.message);
        }
    });
};

module.exports = { startCronJobs };
