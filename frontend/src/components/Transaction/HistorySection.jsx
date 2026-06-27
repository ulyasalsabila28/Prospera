import { formatRupiah, formatDatetime } from '../../utils/format';
import ReportModal from './ReportModal';

export default function HistorySection({
  historySearchTerm, setHistorySearchTerm, activeTab, setActiveTab,
  dateFilterType, setDateFilterType, isDateMenuOpen, setIsDateMenuOpen,
  handleDateFilterChange, customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate, applyCustomDate,
  loading, filteredHistory, getTransactionTypeLabel, openTransactionModal,
  historyPage, historyTotalPages, historyTotalItems, fetchHistory, handleExportExcel, handleExportCsv,
  showReportModal, setShowReportModal
}) {
  return (
    <div className="card">
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0, marginBottom: "16px", color: "var(--bs-body-color)" }}>Riwayat Transaksi</h3>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
          <input 
            className="input" 
            placeholder="🔍 Cari produk..." 
            style={{ width: "200px", padding: "6px 12px" }}
            value={historySearchTerm}
            onChange={(e) => setHistorySearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>

          <div style={{ display: "flex", gap: "8px", background: "rgba(128, 128, 128, 0.1)", padding: "4px", borderRadius: "10px" }}>
            <button onClick={() => setActiveTab("ALL")} style={{ padding: "6px 16px", border: "none", background: activeTab === "ALL" ? "var(--bs-primary)" : "transparent", color: activeTab === "ALL" ? "#fff" : "var(--bs-gray-500, #6B7280)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "ALL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Semua</button>
            <button onClick={() => setActiveTab("SELL")} style={{ padding: "6px 16px", border: "none", background: activeTab === "SELL" ? "#10B981" : "transparent", color: activeTab === "SELL" ? "white" : "var(--bs-gray-500, #6B7280)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "SELL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Penjualan</button>
            <button onClick={() => setActiveTab("BUY")} style={{ padding: "6px 16px", border: "none", background: activeTab === "BUY" ? "#EF4444" : "transparent", color: activeTab === "BUY" ? "white" : "var(--bs-gray-500, #6B7280)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "BUY" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Restock</button>
          </div>

          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="button"
              style={{ background: "var(--bs-body-bg)", color: "var(--bs-body-color)", border: "1px solid var(--bs-border-color)", display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px" }}
            >
              📅 {dateFilterType === "ALL" ? "Semua Waktu" : dateFilterType === "TODAY" ? "Hari Ini" : dateFilterType === "MONTH" ? "Bulan Ini" : "Kustom"}
            </button>

            {isDateMenuOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "var(--bs-body-bg)", border: "1px solid var(--bs-border-color)", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 50, width: "220px", padding: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button onClick={() => handleDateFilterChange("ALL")} style={{ color: "var(--bs-body-color)", textAlign: "left", padding: "8px 12px", background: dateFilterType === "ALL" ? "rgba(128,128,128,0.1)" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Semua Waktu</button>
                  <button onClick={() => handleDateFilterChange("TODAY")} style={{ color: "var(--bs-body-color)", textAlign: "left", padding: "8px 12px", background: dateFilterType === "TODAY" ? "rgba(128,128,128,0.1)" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Hari Ini</button>
                  <button onClick={() => handleDateFilterChange("MONTH")} style={{ color: "var(--bs-body-color)", textAlign: "left", padding: "8px 12px", background: dateFilterType === "MONTH" ? "rgba(128,128,128,0.1)" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Bulan Ini</button>
                  <button onClick={() => setDateFilterType("CUSTOM")} style={{ color: "var(--bs-body-color)", textAlign: "left", padding: "8px 12px", background: dateFilterType === "CUSTOM" ? "rgba(128,128,128,0.1)" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Pilih Manual...</button>
                </div>

                {dateFilterType === "CUSTOM" && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--bs-border-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Dari:</label>
                      <input type="date" className="input" style={{ width: "100%", padding: "6px 8px" }} value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Sampai:</label>
                      <input type="date" className="input" style={{ width: "100%", padding: "6px 8px" }} value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                    </div>
                    <button className="button" style={{ width: "100%", padding: "8px", fontSize: "13px", marginTop: "4px" }} onClick={applyCustomDate}>
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowReportModal(true)}
            className="button"
            style={{ background: "#4F46E5", color: "white", border: "none", display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            title="Lihat Rekapitulasi Laporan dan Export ke Excel"
          >
            📄 Rekap Laporan
          </button>
        </div>
      </div>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table-simple" style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Tipe</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>Tidak ada data pada halaman ini</td>
                </tr>
              ) : (
                filteredHistory.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td>{formatDatetime(tx.transaction_datetime)}</td>
                    <td className="fw-bold">{formatRupiah(tx.total_amount)}</td>
                    <td>
                      <span className={getTransactionTypeLabel(tx) === "SELL" ? "badge safe" : "badge low"}>
                        {getTransactionTypeLabel(tx) === "SELL" ? "Penjualan" : "Restock"}
                      </span>
                    </td>
                    <td>
                      <button className="button" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => openTransactionModal(tx)}>Detail</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {historyTotalPages > 1 && !historySearchTerm && activeTab === "ALL" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
              <span style={{ fontSize: "14px", color: "gray" }}>
                Menampilkan halaman {historyPage} dari {historyTotalPages} ({historyTotalItems} riwayat)
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={historyPage === 1}
                  onClick={() => fetchHistory(dateFilterType, customStartDate, customEndDate, historyPage - 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  <i className="fas fa-chevron-left me-1"></i> Sebelumnya
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={historyPage === historyTotalPages}
                  onClick={() => fetchHistory(dateFilterType, customStartDate, customEndDate, historyPage + 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  Selanjutnya <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        onExport={handleExportExcel} 
        onExportCsv={handleExportCsv}
      />
    </div>
  );
}