/**
 * analyticsService.js — Shared Analytics Query Layer
 * REFACTOR (B-T14/B-T15): Menghilangkan duplikasi query antara
 * analyticsController.js dan exportController.js.
 * 
 * Semua query keuangan terpusat di sini sebagai Single Source of Truth.
 * Jika ada bug fix atau perubahan filter, cukup ubah di satu tempat.
 */

const { Transaction, TransactionDetail, Product, InventoryLog, Category } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { getDateFilter, buildWIBDateRange } = require("../utils/dateUtils");

/**
 * Hitung breakdown status transaksi (success, pending, cancelled)
 * @param {string} startDate - Tanggal awal filter (opsional)
 * @param {string} endDate - Tanggal akhir filter (opsional)
 * @param {number} userId - store_id untuk isolasi tenant
 * @returns {{ success, pending, cancelled, total_transaction_all }}
 */
const getStatusBreakdown = async (startDate, endDate, userId) => {
    const statusData = await Transaction.findAll({
        where: { ...getDateFilter(startDate, endDate), user_id_fk: userId },
        attributes: ['status', [fn('COUNT', col('*')), 'count']],
        group: ['status'],
        raw: true
    });

    let success = 0, pending = 0, cancelled = 0, total_transaction_all = 0;
    statusData.forEach(item => {
        const count = parseInt(item.count);
        if (item.status === 'success') success = count;
        if (item.status === 'pending') pending = count;
        if (item.status === 'cancelled') cancelled = count;
        total_transaction_all += count;
    });

    return { success, pending, cancelled, total_transaction_all };
};

/**
 * Hitung ringkasan keuangan (items_sold, revenue, total_profit, total_loss)
 * PENTING: Hanya menghitung transaksi PENJUALAN (transaction_type = 'sell')
 * FIX (SPOILAGE-01): Menggabungkan 2 sumber kerugian:
 *   1. Kerugian Jual Rugi    — dari TransactionDetail (selling_price < capital_cost)
 *   2. Kerugian Kedaluwarsa  — dari InventoryLog (action = 'WRITE_OFF_EXPIRED')
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {number} userId 
 * @returns {{ items_sold, revenue, total_profit, total_loss, spoilage_loss }}
 */
const getFinancialSummary = async (startDate, endDate, userId) => {
    // Query 1: Kerugian dari transaksi (jual di bawah modal)
    const financialData = await TransactionDetail.findAll({
        include: [{
            model: Transaction,
            attributes: [],
            where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
        }],
        where: { transaction_type: 'sell' },
        attributes: [
            [fn('SUM', col('quantity')), 'items_sold'],
            [literal(`SUM(selling_price * quantity)`), 'revenue'],
            [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), 'total_profit'],
            [literal(`SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)`), 'total_loss']
        ],
        raw: true
    });

    // Query 2: Kerugian dari pemusnahan stok kedaluwarsa (InventoryLog)
    // FIX (SPOILAGE-01 + L1-02): Produk yang dimusnahkan karena expired = kerugian modal penuh.
    // FIX (L1-02): Gunakan buildWIBDateRange — presisi 00:00:00 s/d 23:59:59 WIB
    const spoilageWhere = { 
        user_id_fk: userId, 
        action: 'WRITE_OFF_EXPIRED' 
    };
    const wibRange = buildWIBDateRange(startDate, endDate);
    if (wibRange) spoilageWhere.createdAt = wibRange;

    const spoilageData = await InventoryLog.findAll({
        where: spoilageWhere,
        attributes: [[fn('SUM', col('spoilage_loss')), 'total_spoilage']],
        raw: true
    });

    const fin = financialData[0] || {};
    const spoilage_loss = parseInt(spoilageData[0]?.total_spoilage) || 0;

    return {
        items_sold: parseInt(fin.items_sold) || 0,
        // FIX (CRITICAL-02): Gunakan parseInt (bukan parseFloat) untuk nilai uang.
        // Kolom DB adalah BIGINT — tidak ada desimal nyata. parseFloat bisa menghasilkan
        // 120000.00000000001 akibat floating-point representation error.
        revenue: parseInt(fin.revenue) || 0,
        total_profit: parseInt(fin.total_profit) || 0,
        // total_loss = kerugian jual rugi + kerugian kedaluwarsa (gabungan 2 sumber)
        total_loss: (parseInt(fin.total_loss) || 0) + spoilage_loss,
        spoilage_loss  // Dikembalikan terpisah agar frontend bisa tampilkan breakdown
    };
};

/**
 * Ambil breakdown per produk (qty, subtotal, profit, margin)
 * Dipakai oleh getSummary (analytics) DAN export Excel/CSV
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {number} userId 
 * @param {object} options - { includeProfit: boolean, includeUnitPrice: boolean }
 * @returns {Array} Daftar produk dengan statistik penjualan
 */
const getProductBreakdown = async (startDate, endDate, userId, options = {}) => {
    const { includeProfit = false, includeUnitPrice = false } = options;

    // Build dynamic attributes
    const attributes = [
        [fn("SUM", col("quantity")), "qty"],
        [fn("SUM", literal("quantity * selling_price")), "subtotal"]
    ];

    if (includeProfit) {
        attributes.push(
            [literal("SUM((selling_price - capital_cost) * quantity)"), "total_profit_product"]
        );
    }
    if (includeUnitPrice) {
        attributes.push(
            [literal("MAX(selling_price)"), "unit_price"]
        );
    }

    const detailsData = await TransactionDetail.findAll({
        attributes,
        include: [
            { 
                model: Product, 
                attributes: ["product_name", "product_stock", "expired_date", "min_display_qty", "calculated_reorder_point"], 
                required: true, 
                paranoid: false,
                include: [{ model: Category, attributes: ["category_name"] }]
            },
            { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
        ],
        where: { transaction_type: 'sell' },
        group: [
            "Product.product_id", 
            "Product.product_name", 
            "Product.product_stock", 
            "Product.expired_date", 
            "Product.min_display_qty", 
            "Product.calculated_reorder_point",
            "Product.Category.category_id",
            "Product.Category.category_name"
        ],
        order: [[literal("qty"), "DESC"]],
        raw: true
    });

    return detailsData.map(item => {
        const stock = parseInt(item["Product.product_stock"]) || 0;
        const reorderPoint = parseInt(item["Product.calculated_reorder_point"]) || 0;
        
        let aiStatus = "Aman";
        if (stock === 0) {
            aiStatus = "Habis";
        } else if (stock <= reorderPoint) {
            aiStatus = "Kritis";
        }

        let expiredStr = "-";
        if (item["Product.expired_date"]) {
            const dateObj = new Date(item["Product.expired_date"]);
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0'); // January is 0!
            const yyyy = dateObj.getFullYear();
            expiredStr = `${dd}/${mm}/${yyyy}`;
        }

        const result = {
            name: item["Product.product_name"],
            category: item["Product.Category.category_name"] || "Tanpa Kategori",
            current_stock: stock,
            ai_status: aiStatus,
            expired_date: expiredStr,
            qty: parseInt(item.qty) || 0,
            // FIX (CRITICAL-02): parseInt untuk nilai uang berbasis BIGINT kolom DB
            subtotal: parseInt(item.subtotal) || 0
        };

        if (includeProfit) {
            const profit = parseInt(item.total_profit_product) || 0;
            // margin adalah rasio (%), bukan uang — tetap pakai float untuk presisi desimal
            const margin = result.subtotal > 0 ? ((profit / result.subtotal) * 100).toFixed(1) : 0;
            result.profit = profit;
            result.margin = margin + "%";
        }
        if (includeUnitPrice) {
            result.unitPrice = parseInt(item.unit_price) || 0;
        }

        return result;
    });
};

module.exports = { getStatusBreakdown, getFinancialSummary, getProductBreakdown };
