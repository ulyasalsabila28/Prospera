/**
 * exportController.js — Export data ke Excel dan CSV
 * REFACTOR (B-T15): Sekarang menggunakan analyticsService.js
 * sebagai sumber query tunggal. Tidak lagi menduplikasi query dari analytics.
 */

const { ExcelReport, CsvReport } = require("../services/reportService");
const { getStatusBreakdown, getFinancialSummary, getProductBreakdown } = require("../services/analyticsService");

// 1. EXPORT TO EXCEL
const exportSummaryExcel = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        // Gunakan shared service (Single Source of Truth)
        const [statusBreakdown, financial, details] = await Promise.all([
            getStatusBreakdown(startDate, endDate, userId),
            getFinancialSummary(startDate, endDate, userId),
            getProductBreakdown(startDate, endDate, userId, { includeProfit: true, includeUnitPrice: true })
        ]);

        const realDataDariDB = {
            summary: {
                total_transaction: statusBreakdown.total_transaction_all,
                items_sold: financial.items_sold,
                revenue: financial.revenue,
                total_profit: financial.total_profit
            },
            status_breakdown: {
                success: statusBreakdown.success,
                pending: statusBreakdown.pending,
                cancelled: statusBreakdown.cancelled
            },
            details
        };

        const isOwner = req.user.role === 'owner';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Prospera.xlsx"');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        const report = new ExcelReport(realDataDariDB, res, isOwner);
        await report.generate();

    } catch (error) {
        next(error);
    }
};

// 2. EXPORT CSV
const exportSummaryCsv = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        // Gunakan shared service (Single Source of Truth)
        const [statusBreakdown, financial, details] = await Promise.all([
            getStatusBreakdown(startDate, endDate, userId),
            getFinancialSummary(startDate, endDate, userId),
            getProductBreakdown(startDate, endDate, userId, { includeProfit: true, includeUnitPrice: true })
        ]);

        const realDataDariDB = {
            summary: {
                total_transaction: statusBreakdown.total_transaction_all,
                items_sold: financial.items_sold,
                revenue: financial.revenue,
                total_profit: financial.total_profit
            },
            status_breakdown: {
                success: statusBreakdown.success,
                pending: statusBreakdown.pending,
                cancelled: statusBreakdown.cancelled
            },
            details
        };
        const isOwner = req.user.role === 'owner';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Prospera.csv"');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        const report = new CsvReport(realDataDariDB, res, isOwner);
        await report.generate();

    } catch (error) {
        next(error);
    }
};

module.exports = { exportSummaryExcel, exportSummaryCsv };