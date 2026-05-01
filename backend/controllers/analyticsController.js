const { Transaction, TransactionDetail, Product } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { ExcelReport, CsvReport } = require("../services/reportService"); // <-- IMPORT SERVICE EXCEL & CSV

const getDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};


// 1. SUMMARY 
const getSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        // filter status
        const statusData = await Transaction.findAll({
            where: {
                ...getDateFilter(startDate, endDate),
                user_id_fk: userId
            },
            attributes: ['status', [fn('COUNT', col('*')), 'count']],
            group: ['status'],
            raw: true
        });

        let success = 0, pending = 0, cancelled = 0;
        let total_transaction_all = 0;

        statusData.forEach(item => {
            const count = parseInt(item.count);
            if (item.status === 'success') success = count;
            if (item.status === 'pending') pending = count;
            if (item.status === 'cancelled') cancelled = count;
            total_transaction_all += count;
        });

        //menghitung financial
        const financialData = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: {
                    ...getDateFilter(startDate, endDate),
                    user_id_fk: userId,
                    status: 'success' 
                }
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
        const average_sale = success > 0 ? Math.round(revenue / success) : 0;

        // menghitung revenue growth
        let revenue_growth = "N/A"; 
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;

            const prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - diffDays + 1);

            const prevFinancialData = await TransactionDetail.findAll({
                include: [{
                    model: Transaction,
                    attributes: [],
                    where: {
                        ...getDateFilter(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]),
                        user_id_fk: userId,
                        status: 'success'
                    }
                }],
                attributes: [[literal(`SUM(selling_price * quantity)`), 'prev_revenue']],
                raw: true
            });

            const prev_revenue = parseFloat(prevFinancialData[0]?.prev_revenue) || 0;

            if (prev_revenue === 0 && revenue > 0) {
                revenue_growth = "+100%"; 
            } else if (prev_revenue > 0) {
                const growthCalc = ((revenue - prev_revenue) / prev_revenue) * 100;
                const sign = growthCalc > 0 ? "+" : "";
                revenue_growth = `${sign}${Math.round(growthCalc)}%`;
            } else {
                revenue_growth = "0%";
            }
        }

        // mengambil tabel transaction detail
        const detailsData = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "qty"],
                [fn("SUM", literal("quantity * selling_price")), "subtotal"]
            ],
            include: [
                {
                    model: Product,
                    attributes: ["product_name"],
                    required: true
                },
                {
                    model: Transaction,
                    attributes: [],
                    where: {
                        ...getDateFilter(startDate, endDate),
                        user_id_fk: userId,
                        status: 'success' 
                    }
                }
            ],
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("qty"), "DESC"]],
            raw: true
        });

        const formattedDetails = detailsData.map(item => ({
            name: item["Product.product_name"],
            qty: parseInt(item.qty) || 0,
            subtotal: parseFloat(item.subtotal) || 0
        }));

        res.json({
            summary: {
                total_transaction: total_transaction_all,
                items_sold: items_sold,
                revenue: revenue,
                total_profit: total_profit,
                average_sale: average_sale,
                revenue_growth: revenue_growth
            },
            status_breakdown: {
                success: success,
                pending: pending,
                cancelled: cancelled
            },
            details: formattedDetails
        });
    } catch (error) {
        console.error("Error di getSummary:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal saat mengambil summary." });
    }
};


// 2. PROFIT & LOSS
const getProfit = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        const result = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: {
                    ...getDateFilter(startDate, endDate),
                    user_id_fk: userId,
                    status: 'success'
                }
            }],
            attributes: [
                [
                    literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`),
                    "total_profit"
                ],
                [
                    literal(`SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)`),
                    "total_loss"
                ],
                [
                    literal(`SUM(selling_price * quantity)`),
                    "total_revenue"
                ]
            ],
            raw: true
        });

        const profit = parseFloat(result[0].total_profit) || 0;
        const loss = parseFloat(result[0].total_loss) || 0;
        const revenue = parseFloat(result[0].total_revenue) || 0;
        
        const net_income = profit - loss;
        const profit_margin = revenue > 0 
            ? ((net_income / revenue) * 100).toFixed(2) 
            : 0;

        res.json({
            revenue,
            total_profit: profit,
            total_loss: loss,
            net_income,
            profit_margin: `${profit_margin}%`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. TOP PRODUCT
const getTopProduct = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const userId = req.user.id;

        const rows = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "sold"],
                [fn("SUM", literal("quantity * selling_price")), "revenue"],
                [literal("SUM((selling_price - capital_cost) * quantity)"), "laba"]
            ],
            include: [
                {
                    model: Product,
                    attributes: ["product_name"],
                    required: true
                },
                {
                    model: Transaction,
                    attributes: [],
                    where: {
                        ...getDateFilter(startDate, endDate),
                        user_id_fk: userId,
                        status: 'success' 
                    }
                }
            ],
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("sold"), "DESC"]],
            limit: limit ? parseInt(limit) : 5,
            raw: true
        });

        res.json(rows.map(item => ({
            product_id: item["Product.product_id"],
            product_name: item["Product.product_name"],
            sold: parseInt(item.sold) || 0,
            revenue: parseFloat(item.revenue) || 0,
            laba: parseFloat(item.laba) || 0
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. MONTHLY REPORT 
const getMonthly = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        const rows = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: {
                    ...getDateFilter(startDate, endDate),
                    user_id_fk: userId,
                    status: 'success' 
                }
            }],
            attributes: [
                [fn("DATE_FORMAT", col("Transaction.transaction_datetime"), "%Y-%m"), "month"],
                [literal(`SUM(selling_price * quantity)`), "revenue"],
                [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), "laba_bersih"],
                [fn("COUNT", fn("DISTINCT", col("Transaction.transaction_id"))), "total_transaction"]
            ],
            group: [fn("DATE_FORMAT", col("Transaction.transaction_datetime"), "%Y-%m")],
            order: [[literal("month"), "ASC"]],
            raw: true
        });

        res.json(rows.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue) || 0,
            laba_bersih: parseFloat(item.laba_bersih) || 0, 
            total_transaction: parseInt(item.total_transaction) || 0,
            average_sale: parseInt(item.total_transaction) > 0 ? (parseFloat(item.revenue) / parseInt(item.total_transaction)) : 0
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. EXPORT TO EXCEL
const exportSummaryExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id; 

        //tarik status transaksi
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

        // tarik data finansial
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

        // hitung nominal dan margin
        const detailsData = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "qty"],
                [fn("SUM", literal("quantity * selling_price")), "subtotal"],
                [literal("SUM((selling_price - capital_cost) * quantity)"), "total_profit_product"],
                [literal("MAX(selling_price)"), "unit_price"]
            ],
            include: [
                { model: Product, attributes: ["product_name"], required: true },
                { 
                    model: Transaction, 
                    attributes: [], 
                    where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } 
                }
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
            summary: { total_transaction: total_transaction_all, items_sold: items_sold, revenue: revenue, total_profit: total_profit },
            status_breakdown: { success: success, pending: pending, cancelled: cancelled },
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

// 6. EXPORT CSV (TABEL DATAR)
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
                { 
                    model: Transaction, 
                    attributes: [], 
                    where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } 
                }
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

module.exports = { 
    getSummary, 
    getProfit, 
    getTopProduct, 
    getMonthly,
    exportSummaryExcel,
    exportSummaryCsv 
};