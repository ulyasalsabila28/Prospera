import { useEffect, useRef } from 'react';
import { formatRupiah, formatDatetime } from '../../utils/format';
import { printReceipt } from '../../utils/transactionHelpers';

/**
 * TransactionDetailModal.jsx
 * FIX (MEDIUM-FE-02): Tambah ARIA attributes, Escape key handler, dan auto-focus
 * untuk memenuhi standar accessibility enterprise (WCAG 2.1 AA).
 *
 * Perubahan HANYA pada aksesibilitas — logika bisnis, validasi, dan tampilan
 * data transaksi tidak diubah sama sekali.
 */
export default function TransactionDetailModal({
  showTransactionModal, selectedTransaction, closeTransactionModal, getTransactionTypeLabel
}) {
  const closeButtonRef = useRef(null);

  // Auto-focus tombol Tutup saat modal terbuka (focus trap sederhana)
  useEffect(() => {
    if (showTransactionModal && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showTransactionModal]);

  // Escape key handler
  useEffect(() => {
    if (!showTransactionModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeTransactionModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTransactionModal, closeTransactionModal]);

  if (!showTransactionModal || !selectedTransaction) return null;

  return (
    // Overlay: klik di luar modal untuk tutup
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) closeTransactionModal(); }}
      aria-hidden="true"
    >
      {/* Dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trx-modal-title"
        className="modal-content"
        style={{ width: "min(95%, 780px)", borderRadius: "16px", padding: "24px", border: "none", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 id="trx-modal-title">Detail Transaksi</h3>
            <p style={{ margin: 0, color: "var(--bs-gray-500, #9ca3af)" }}>{formatDatetime(selectedTransaction.transaction_datetime)}</p>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <strong>Total:</strong> {formatRupiah(selectedTransaction.total_amount)} • <strong>Tipe:</strong> {getTransactionTypeLabel(selectedTransaction)}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-simple" style={{ width: "100%" }} aria-label="Daftar item transaksi">
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th scope="col">Produk</th>
                <th scope="col">Tipe</th>
                <th scope="col">Qty</th>
                <th scope="col">Modal</th>
                <th scope="col">Harga</th>
                <th scope="col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedTransaction.TransactionDetails?.map((item) => (
                <tr key={item.detail_id}>
                  <td>
                    <div>{item.Product?.product_name || "-"}</div>
                    {item.Product?.Category && (
                      <small style={{ color: "#6B7280" }}>{item.Product.Category.category_name}</small>
                    )}
                  </td>
                  <td>
                      <span className={item.transaction_type?.toUpperCase() === "SELL" ? "badge safe" : "badge low"}>
                        {item.transaction_type?.toUpperCase() === "SELL" ? "Jual" : "Beli"}
                      </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatRupiah(item.capital_cost)}</td>
                  <td>{formatRupiah(item.selling_price)}</td>
                  <td className="fw-bold">{formatRupiah(item.sub_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
          <button
            className="button"
            onClick={() => printReceipt(selectedTransaction)}
            style={{ background: "white", color: "#10B981", border: "1px solid #10B981", padding: "6px 14px", fontSize: "13px" }}
          >
            <i className="fas fa-print me-2"></i>Cetak Struk
          </button>
          <button
            ref={closeButtonRef}
            className="button"
            onClick={closeTransactionModal}
            style={{ background: "#EF4444", color: "white", padding: "6px 14px", fontSize: "13px" }}
            aria-label="Tutup modal detail transaksi"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}