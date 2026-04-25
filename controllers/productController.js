const { Product } = require('../models');

// Mengambil seluruh data produk berdasarkan ID pengguna yang sedang masuk.
const getAllProducts = async (req, res) => {
    try {
        const userId = req.user.id; 
        const products = await Product.findAll({
            where: { user_id_fk: userId }
        });
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Mengambil satu data produk spesifik berdasarkan ID produk dan ID pengguna.
const getProductById = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;

        const product = await Product.findOne({
            where: { 
                product_id: productId, 
                user_id_fk: userId 
            }
        });
        
        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Menambahkan data produk baru ke dalam basis data.
const createProduct = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { product_name, product_cost, product_price, product_stock } = req.body;
        
        // Memvalidasi masukan agar tidak ada data kosong.
        if (!product_name || product_cost === undefined || product_price === undefined) {
            return res.status(400).json({ message: "Nama, Harga Modal, dan Harga Jual wajib diisi!" });
        }

        const newProduct = await Product.create({
            user_id_fk: userId,
            product_name: product_name,
            product_cost: product_cost,
            product_price: product_price,
            product_stock: product_stock || 0
        });

        res.status(201).json({ 
            message: "Produk berhasil ditambahkan ke toko Anda.", 
            productId: newProduct.product_id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Memperbarui data produk yang sudah ada berdasarkan ID produk.
const updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;
        const { product_name, product_cost, product_price, product_stock } = req.body;

        // Memvalidasi masukan sebelum proses pembaruan.
        if (!product_name || product_cost === undefined || product_price === undefined) {
            return res.status(400).json({ message: "Nama, Harga Modal, dan Harga Jual tidak boleh kosong!" });
        }

        const [updatedRows] = await Product.update(
            {
                product_name: product_name,
                product_cost: product_cost,
                product_price: product_price,
                product_stock: product_stock
            },
            {
                where: { 
                    product_id: productId, 
                    user_id_fk: userId 
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }
        res.status(200).json({ message: "Data produk berhasil diperbarui." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Menghapus data produk dari basis data.
const deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;

        const deletedRows = await Product.destroy({
            where: { 
                product_id: productId, 
                user_id_fk: userId 
            }
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }
        res.status(200).json({ message: "Produk berhasil dihapus." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };