const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

// Import fungsi analitik dari analyticsController (Tambahin getLossProducts)
const {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly,
    getLossProducts
} = require("../controllers/analyticsController");

// Import fungsi export dari exportController
const {
    exportSummaryExcel,
    exportSummaryCsv 
} = require("../controllers/exportController");

// Routes
router.get("/summary", authMiddleware, getSummary);
router.get("/profit", authMiddleware, getProfit);
router.get("/top-product", authMiddleware, getTopProduct);
router.get("/monthly", authMiddleware, getMonthly);
router.get("/loss-products", authMiddleware, getLossProducts); // <-- Rute Baru

router.get("/summary/export/excel", authMiddleware, exportSummaryExcel); 
router.get("/summary/export/csv", authMiddleware, exportSummaryCsv);

module.exports = router;