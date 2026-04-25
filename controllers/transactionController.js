const { sequelize, Transaction, TransactionDetail, Product } = require('../models');

// 1. Fungsi untuk melakukan proses pembayaran (Dilengkapi Sistem Rollback)
const createTransaction = async (req, res) => {
    const userId = req.user.id; 
    const { items } = req.body; 

    // Memvalidasi apakah keranjang belanja memiliki isi
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Keranjang belanja kosong!" });
    }

    // Membuka koneksi khusus untuk sistem pengamanan transaksi (Rollback)
    const t = await sequelize.transaction();

    try {
        let total_amount = 0;
        let validItems = [];

        // Tahap 1: Memeriksa ketersediaan stok produk dan menghitung total harga
        for (let item of items) {
            // Mengambil data produk sekaligus mengunci baris data tersebut (FOR UPDATE)
            // Hal ini mencegah pembeli lain mengambil stok yang sama di waktu yang bersamaan
            const product = await Product.findOne({
                where: { 
                    product_id: item.product_id, 
                    user_id_fk: userId 
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            
            if (!product) {
                throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
            }

            if (product.product_stock < item.quantity) {
                throw new Error(`Stok ${product.product_name} tidak mencukupi. Sisa stok: ${product.product_stock}`);
            }

            const sub_total = product.product_price * item.quantity;
            total_amount += sub_total;

            validItems.push({
                product_id: product.product_id,
                quantity: item.quantity,
                capital_cost: product.product_cost, 
                selling_price: product.product_price, 
                sub_total: sub_total
            });
        }

        // Tahap 2: Membuat pencatatan struk utama di tabel Transactions
        const newTransaction = await Transaction.create(
            {
                user_id_fk: userId,
                total_amount: total_amount
            },
            { transaction: t }
        );

        // Tahap 3: Memasukkan rincian barang ke Transaction_details dan mengurangi stok
        for (let vItem of validItems) {
            await TransactionDetail.create(
                {
                    transaction_id_fk: newTransaction.transaction_id,
                    product_id_fk: vItem.product_id,
                    quantity: vItem.quantity,
                    capital_cost: vItem.capital_cost,
                    selling_price: vItem.selling_price,
                    sub_total: vItem.sub_total
                },
                { transaction: t }
            );

            // Mengurangi jumlah stok produk secara langsung di basis data
            await Product.decrement('product_stock', {
                by: vItem.quantity,
                where: { product_id: vItem.product_id },
                transaction: t
            });
        }

        // Menyimpan seluruh perubahan secara permanen ke basis data jika tidak ada kesalahan
        await t.commit();

        res.status(201).json({ 
            message: "Transaksi berhasil diproses!", 
            transaction_id: newTransaction.transaction_id,
            total_belanja: total_amount
        });

    } catch (error) {
        // Mengeksekusi pembatalan (rollback) basis data.
        // Proses ini akan membatalkan seluruh kueri yang sudah berjalan 
        // apabila terjadi kegagalan pada tahapan apa pun di atas.
        await t.rollback();
        
        console.error("Transaksi Gagal, Rollback dilakukan:", error.message);
        
        // Mengirimkan pesan kesalahan spesifik ke sisi klien (Frontend)
        if (error.message.includes("tidak ditemukan") || error.message.includes("tidak mencukupi")) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Terjadi kesalahan pada mesin transaksi." });
        }
    }
};

// 2. Fungsi untuk mengambil riwayat transaksi toko
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Mengambil seluruh data riwayat dan mengurutkannya dari yang paling baru (DESC)
        const transactions = await Transaction.findAll({
            where: { user_id_fk: userId },
            order: [['transaction_datetime', 'DESC']]
        });
        
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil riwayat transaksi." });
    }
};

module.exports = { createTransaction, getTransactionHistory };