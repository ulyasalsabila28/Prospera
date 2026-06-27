/**
 * useTransactionLogic.js — Orchestrator Hook
 * REFACTOR (F-T02): Dipecah dari god-hook 287 baris menjadi komposisi 3 hook terfokus.
 * 
 * Sebelum: 1 file monolitik dengan 30+ state, 40+ return values, mengelola
 * cart + history + products + pagination + modal + search + date filter sekaligus.
 * 
 * Sesudah: Orchestrator tipis yang menggabungkan:
 * - useCart.js     → Keranjang belanja & proses checkout
 * - useHistory.js  → Riwayat transaksi & filter tanggal
 * 
 * Hook ini tetap meng-export interface yang IDENTIK dengan versi lama,
 * sehingga komponen Transaction.jsx TIDAK perlu diubah sama sekali.
 */

import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { getTransactionTypeLabel } from "../utils/transactionHelpers";
import { useCart } from "./useCart";
import { useHistory } from "./useHistory";

export function useTransactionLogic() {
    // ========== PRODUCTS (shared state) ==========
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        try {
            const data = await apiFetch("/products");
            setProducts(data.products ? data.products : (Array.isArray(data) ? data : []));
        } catch (error) {
            historyHook.fetchError || console.error("Gagal memuat produk:", error);
        }
    };

    // ========== COMPOSE SUB-HOOKS ==========
    const historyHook = useHistory();
    const cartHook = useCart(products, fetchProducts, historyHook.fetchHistory);

    // ========== AUTO-SYNC selected product price ==========
    useEffect(() => {
        if (!cartHook.selectedProduct) {
            cartHook.setModal("");
            cartHook.setHargaJual("");
            return;
        }
        if (!cartHook.modal) cartHook.setModal(String(cartHook.selectedProduct.product_cost ?? ""));
        if (!cartHook.hargaJual) {
            cartHook.setHargaJual(
                String(cartHook.transactionType === "sell"
                    ? cartHook.selectedProduct.product_price ?? cartHook.selectedProduct.product_cost
                    : cartHook.selectedProduct.product_cost)
            );
        }
    }, [cartHook.selectedProduct, cartHook.transactionType]);

    // ========== INITIAL FETCH ==========
    useEffect(() => {
        // FIX (MEDIUM-11): AbortController mencegah memory leak jika component
        // unmount sebelum fetch selesai (misal: user navigasi keluar saat loading).
        const controller = new AbortController();

        const initialize = async () => {
            try {
                const data = await apiFetch("/products", { signal: controller.signal });
                setProducts(data.products ? data.products : (Array.isArray(data) ? data : []));
            } catch (error) {
                // AbortError adalah expected — abaikan. Error lain tetap di-log.
                if (error.name !== 'AbortError') {
                    console.error("Gagal memuat produk:", error);
                }
            }
            // History tidak perlu signal karena historyHook sudah mengelola state-nya sendiri
            historyHook.fetchHistory("ALL", "", "");
        };

        initialize();

        // Cleanup: batalkan fetch yang in-flight saat component unmount
        return () => controller.abort();
    }, []);

    // ========== RETURN IDENTIK dengan versi lama ==========
    // Ini memastikan backward-compatibility total dengan Transaction.jsx
    return {
        // Cart
        cartItems: cartHook.cartItems,
        setCartItems: cartHook.setCartItems,
        selectedProductId: cartHook.selectedProductId,
        setSelectedProductId: cartHook.setSelectedProductId,
        transactionType: cartHook.transactionType,
        setTransactionType: cartHook.setTransactionType,
        quantity: cartHook.quantity,
        setQuantity: cartHook.setQuantity,
        modal: cartHook.modal,
        setModal: cartHook.setModal,
        hargaJual: cartHook.hargaJual,
        setHargaJual: cartHook.setHargaJual,
        datetime: cartHook.datetime,
        setDatetime: cartHook.setDatetime,
        message: cartHook.message,
        messageType: cartHook.messageType,
        saving: cartHook.saving,
        lastTransaction: cartHook.lastTransaction,
        searchTerm: cartHook.searchTerm,
        setSearchTerm: cartHook.setSearchTerm,
        isDropdownOpen: cartHook.isDropdownOpen,
        setIsDropdownOpen: cartHook.setIsDropdownOpen,
        filteredProducts: cartHook.filteredProducts,
        totalAmount: cartHook.totalAmount,
        addItem: cartHook.addItem,
        removeItem: cartHook.removeItem,
        saveTransaction: cartHook.saveTransaction,

        // History
        fetchError: historyHook.fetchError,
        loading: historyHook.loading,
        selectedTransaction: historyHook.selectedTransaction,
        showTransactionModal: historyHook.showTransactionModal,
        activeTab: historyHook.activeTab,
        setActiveTab: historyHook.setActiveTab,
        dateFilterType: historyHook.dateFilterType,
        setDateFilterType: historyHook.setDateFilterType,
        customStartDate: historyHook.customStartDate,
        setCustomStartDate: historyHook.setCustomStartDate,
        customEndDate: historyHook.customEndDate,
        setCustomEndDate: historyHook.setCustomEndDate,
        isDateMenuOpen: historyHook.isDateMenuOpen,
        setIsDateMenuOpen: historyHook.setIsDateMenuOpen,
        historySearchTerm: historyHook.historySearchTerm,
        setHistorySearchTerm: historyHook.setHistorySearchTerm,
        filteredHistory: historyHook.filteredHistory,
        historyPage: historyHook.historyPage,
        historyTotalPages: historyHook.historyTotalPages,
        historyTotalItems: historyHook.historyTotalItems,
        fetchHistory: historyHook.fetchHistory,
        handleDateFilterChange: historyHook.handleDateFilterChange,
        applyCustomDate: historyHook.applyCustomDate,
        openTransactionModal: historyHook.openTransactionModal,
        closeTransactionModal: historyHook.closeTransactionModal,
        handleExportExcel: historyHook.handleExportExcel,
        handleExportCsv: historyHook.handleExportCsv,
        showReportModal: historyHook.showReportModal,
        setShowReportModal: historyHook.setShowReportModal,

        // Shared
        getTransactionTypeLabel,

        // Overtime Auth
        overtimeModal: cartHook.overtimeModal,
        setOvertimeModal: cartHook.setOvertimeModal,
        submitOvertimeAuth: cartHook.submitOvertimeAuth
    };
}