const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { getStockStatus } = require('../utils/stockHelper');

// Mengambil seluruh data produk berdasarkan ID pengguna yang sedang masuk.
const getAllProducts = async (req, res, next) => {
    try {
        const userId = req.user.store_id; 
        // Default page 1. FIX (HIGH-03): Hardcap limit produk untuk mencegah abuse.
        // SmartPredict.jsx memanggil tanpa limit (butuh semua produk) → dapat default 500.
        // Cap 500 cukup untuk produk UMKM manapun dan tidak menyebabkan memory issue.
        const MAX_LIMIT = 500;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 500, MAX_LIMIT);
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            where: { user_id_fk: userId },
            limit: limit,
            offset: offset,
            order: [['product_id', 'DESC']],
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'requires_expired_date']
            }]
        });

        const productIds = rows.map(p => p.product_id);
        const productDataMap = {};
        rows.forEach(p => {
            productDataMap[p.product_id] = {
                product_stock: p.product_stock,
                createdAt: p.createdAt,
                deletedAt: p.deletedAt
            };
        });

        const { calculateRestockForProducts } = require('../services/aiRestockService');
        const restockSuggestions = await calculateRestockForProducts(userId, productIds, productDataMap);

        // FIX (MED-02): Payload Diet — strip field internal/redundant dari response JSON.
        // user_id_fk: sudah diketahui dari JWT, tidak perlu dikirim ulang ke browser.
        // deletedAt: selalu null untuk active records (tidak informatif).
        // updatedAt: frontend tidak butuh ini untuk render UI produk.
        // Query tetap mengambil semua field (aiRestockService butuh data lengkap).
        const productsWithStatus = rows.map(p => {
            const { user_id_fk, deletedAt, updatedAt, ...productData } = p.toJSON(); // eslint-disable-line no-unused-vars
            productData.stock_status = getStockStatus(
                productData.product_stock,
                productData.min_display_qty,
                productData.calculated_reorder_point
            ); 
            
            const aiData = restockSuggestions[productData.product_id] || { suggested_restock: 0, velocity: 0 };
            productData.suggested_restock = aiData.suggested_restock;
            productData.velocity = aiData.velocity; // Tambahkan untuk XAI
            
            return productData;
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            products: productsWithStatus
        });
    } catch (error) {
        next(error);
    }
};

// Mengambil satu data produk spesifik
const getProductById = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const productId = req.params.id;

        const product = await Product.findOne({
            where: { 
                product_id: productId, 
                user_id_fk: userId 
            },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'requires_expired_date']
            }]
        });
        
        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

// Menambahkan data produk baru
const createProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id; 
        const { product_name, product_cost, product_price, product_stock, category_id_fk, expired_date } = req.body;
        
        if (Number(product_cost) < 500 || Number(product_price) < 500) {
            return res.status(400).json({ message: "Harga modal dan harga jual minimal Rp 500." });
        }
        if (Number(product_stock) < 0) {
            return res.status(400).json({ message: "Stok tidak boleh negatif." });
        }

        // Validasi Kategori: Apakah mewajibkan Tanggal Kedaluwarsa?
        if (category_id_fk) {
            const category = await Category.findByPk(category_id_fk);
            if (category && category.requires_expired_date && !expired_date) {
                return res.status(400).json({ message: `Produk dalam kategori "${category.category_name}" wajib memiliki Tanggal Kedaluwarsa.` });
            }
        }

        // Cek duplikasi nama produk (logika bisnis, tetap di controller)
        const existingProduct = await Product.findOne({
            where: {
                user_id_fk: userId,
                product_name: product_name
            }
        });

        if (existingProduct) {
            return res.status(400).json({ message: `Produk dengan nama "${product_name}" sudah ada di toko Anda.` });
        }

        let finalExpiredDate = expired_date || null;
        if (Number(product_stock) === 0) {
            finalExpiredDate = null;
        }

        const newProduct = await Product.create({
            user_id_fk: userId,
            product_name: product_name,
            product_cost: product_cost,
            product_price: product_price,
            product_stock: product_stock,
            category_id_fk: category_id_fk || null,
            expired_date: finalExpiredDate
        });

        res.status(201).json({ 
            message: "Produk berhasil ditambahkan ke toko Anda.", 
            productId: newProduct.product_id 
        });
    } catch (error) {
        next(error);
    }
};

// Memperbarui data produk yang sudah ada
const updateProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const productId = req.params.id;
        const { product_name, product_cost, product_price, product_stock, category_id_fk, expired_date } = req.body;

        if (Number(product_cost) < 500 || Number(product_price) < 500) {
            return res.status(400).json({ message: "Harga modal dan harga jual minimal Rp 500." });
        }
        if (Number(product_stock) < 0) {
            return res.status(400).json({ message: "Stok tidak boleh negatif." });
        }

        // Validasi Kategori: Apakah mewajibkan Tanggal Kedaluwarsa?
        if (category_id_fk) {
            const category = await Category.findByPk(category_id_fk);
            if (category && category.requires_expired_date && !expired_date) {
                return res.status(400).json({ message: `Produk dalam kategori "${category.category_name}" wajib memiliki Tanggal Kedaluwarsa.` });
            }
        }

        // Fetch the existing product to check previous stock
        const currentProduct = await Product.findOne({
            where: { product_id: productId, user_id_fk: userId }
        });

        if (!currentProduct) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }

        let finalExpiredDate = expired_date || null;

        // Auto-Nullification jika stok jadi 0
        if (Number(product_stock) === 0) {
            finalExpiredDate = null;
        }

        // Cek duplikasi nama produk dengan mengecualikan produk ini sendiri
        const duplicateProduct = await Product.findOne({
            where: {
                user_id_fk: userId,
                product_name: req.body.product_name,
                product_id: { [Op.ne]: req.params.id }
            }
        });

        if (duplicateProduct) {
            return res.status(400).json({ message: `Nama "${product_name}" sudah digunakan oleh produk lain di toko Anda.` });
        }

        const [updatedRows] = await Product.update(
            {
                product_name: product_name,
                product_cost: product_cost,
                product_price: product_price,
                product_stock: product_stock,
                category_id_fk: category_id_fk || null,
                expired_date: finalExpiredDate
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
        next(error);
    }
};

// Menghapus data produk
const deleteProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
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
        next(error);
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };