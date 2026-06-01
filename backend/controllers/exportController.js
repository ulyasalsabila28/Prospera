const { Transaction, TransactionDetail, Product } = require("../models");
const { fn, col, literal } = require("sequelize");
const { ExcelReport, CsvReport } = require("../services/reportService");
const { getDateFilter } = require("../utils/dateUtils"); // <-- Import dari utils

// 1. EXPORT TO EXCEL
const exportSummaryExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id; 

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

        const financialData = await TransactionDetail.findAll({
            include: [{
                model: Transaction, attributes: [],
                where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
            }],
            attributes: [
                [fn('SUM', col('quantity')), 'items_sold'],
                [literal(`SUM(selling_price * quantity)`), 'revenue'],
                [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), 'total_profit']
            ],
            raw: true
        });

        const fin = financialData[0] || {};
        const items_sold = parseInt(fin.items_sold) || 0;
        const revenue = parseFloat(fin.revenue) || 0;
        const total_profit = parseFloat(fin.total_profit) || 0;

        const detailsData = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "qty"],
                [fn("SUM", literal("quantity * selling_price")), "subtotal"],
                [literal("SUM((selling_price - capital_cost) * quantity)"), "total_profit_product"],
                [literal("MAX(selling_price)"), "unit_price"]
            ],
            include: [
                { model: Product, attributes: ["product_name"], required: true },
                { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
            ],
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("qty"), "DESC"]],
            raw: true
        });

        const formattedDetails = detailsData.map(item => {
            const subtotal = parseFloat(item.subtotal) || 0;
            const profit = parseFloat(item.total_profit_product) || 0;
            const margin = subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : 0;

            return {
                name: item["Product.product_name"],
                qty: parseInt(item.qty) || 0,
                unitPrice: parseFloat(item.unit_price) || 0,
                subtotal: subtotal,
                profit: profit,
                margin: margin + "%" 
            };
        });

        const realDataDariDB = {
            summary: { total_transaction: total_transaction_all, items_sold, revenue, total_profit },
            status_breakdown: { success, pending, cancelled },
            details: formattedDetails
        };

        const report = new ExcelReport(realDataDariDB);
        const fileBuffer = await report.generate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Prospera.xlsx"');
        res.send(fileBuffer);

    } catch (error) {
        console.error("Error Export Excel:", error);
        res.status(500).json({ message: "Gagal membuat file Excel" });
    }
};

// 2. EXPORT CSV
const exportSummaryCsv = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id; 

        const detailsData = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "qty"],
                [fn("SUM", literal("quantity * selling_price")), "subtotal"],
                [literal("SUM((selling_price - capital_cost) * quantity)"), "total_profit_product"],
                [literal("MAX(selling_price)"), "unit_price"]
            ],
            include: [
                { model: Product, attributes: ["product_name"], required: true },
                { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
            ],
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("qty"), "DESC"]],
            raw: true
        });

        const formattedDetails = detailsData.map(item => {
            const subtotal = parseFloat(item.subtotal) || 0;
            const profit = parseFloat(item.total_profit_product) || 0;
            const margin = subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : 0;

            return {
                name: item["Product.product_name"],
                qty: parseInt(item.qty) || 0,
                unitPrice: parseFloat(item.unit_price) || 0,
                subtotal: subtotal,
                profit: profit,
                margin: margin + "%"
            };
        });

        const realDataDariDB = { details: formattedDetails }; 
        const report = new CsvReport(realDataDariDB);
        const fileBuffer = await report.generate();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Prospera.csv"');
        res.send(fileBuffer);

    } catch (error) {
        console.error("Error Export CSV:", error);
        res.status(500).json({ message: "Gagal membuat file CSV" });
    }
};

module.exports = { exportSummaryExcel, exportSummaryCsv };