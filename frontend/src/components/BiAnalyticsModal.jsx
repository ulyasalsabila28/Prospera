/**
 * BiAnalyticsModal.jsx — Modal komponen untuk halaman BI Analytics
 * REFACTOR (F-T01): Diekstrak dari BiAnalytics.jsx (monster 425 baris)
 * 
 * Menangani rendering 5 tipe modal:
 * - 'pnl'         → Kalkulasi Laba Rugi (P&L) — termasuk spoilage
 * - 'loss'        → Rincian Barang Rugi (jual di bawah modal)
 * - 'spoilage'    → Rincian Kerugian Kedaluwarsa (FIX SPOILAGE-01)
 * - 'profit'      → Rincian Penyumbang Laba
 * - 'transaction'  → Status Transaksi Breakdown
 */

import { formatRupiah } from '../utils/format';
import { formatDatetime } from '../utils/format';

/**
 * Render konten P&L (Profit & Loss) — FIX (SPOILAGE-01): Tampilkan 2 sumber kerugian
 */
function PnlContent({ ringkasan }) {
    return (
        <div className="p-4 bg-body">
            <div className="mb-4 p-3 rounded bg-body-secondary border">
                <span className="d-block text-muted mb-1" style={{fontSize: "14px"}}>Total Pendapatan Kotor (Omzet)</span>
                <span className="fw-bold text-body" style={{fontSize: "20px"}}>{formatRupiah(ringkasan.penjualan)}</span>
            </div>
            
            <h6 className="fw-bold text-secondary mb-3"><i className="fas fa-list me-2"></i>Rincian Kalkulasi:</h6>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "16px"}}>Laba Kotor (Untung)</span>
                <span className="fw-bold text-success" style={{fontSize: "16px"}}>+{formatRupiah(ringkasan.labaKotor)}</span>
            </div>
            {/* L2-01: Re-label konsisten dengan card di dashboard */}
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "16px"}}>💸 Defisit Markdown <small className="text-muted" style={{fontSize:'11px'}}>(jual di bawah modal)</small></span>
                <span className="fw-bold" style={{fontSize: "16px", color: '#b45309'}}>-{formatRupiah(ringkasan.rugi)}</span>
            </div>
            {/* FIX (SPOILAGE-01): Tampilkan kerugian kedaluwarsa secara eksplisit */}
            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-2">
                <span className="text-muted" style={{fontSize: "16px"}}>
                    🗑 Kerugian Kedaluwarsa
                    {ringkasan.qtyDestroyed > 0 && (
                        <small className="text-muted ms-2" style={{fontSize: '12px'}}>({ringkasan.qtyDestroyed} unit dimusnahkan)</small>
                    )}
                </span>
                <span className="fw-bold text-warning" style={{fontSize: "16px"}}>-{formatRupiah(ringkasan.spoilage)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "14px"}}>Total Kerugian Gabungan</span>
                <span className="fw-bold text-danger" style={{fontSize: "14px"}}>-{formatRupiah(ringkasan.totalLoss)}</span>
            </div>
            <div className="d-flex justify-content-between mt-3">
                <span className="fw-bold text-body" style={{ fontSize: "1.2rem" }}>Total Laba Bersih</span>
                <span className="fw-bold text-primary" style={{ fontSize: "1.2rem" }}>{formatRupiah(ringkasan.labaBersih)}</span>
            </div>
        </div>
    );
}

/**
 * Render tabel berdasarkan tipe modal (loss, profit, transaction)
 */
function TableContent({ type, data }) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-secondary">
                    {type === 'loss' ? (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Nama Barang</th>
                            <th className="text-center">Vol</th>
                            <th className="text-end">Modal/Unit</th>
                            <th className="text-end">Jual/Unit</th>
                            <th className="text-end pe-4">Total Rugi</th>
                        </tr>
                    ) : type === 'profit' ? (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Nama Barang</th>
                            <th className="text-center">Vol</th>
                            <th className="text-end">Total Omzet</th>
                            <th className="text-center">Margin</th>
                            <th className="text-end pe-4">Total Laba</th>
                        </tr>
                    ) : (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Status Transaksi</th>
                            <th className="text-end pe-4">Total Struk</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {type === 'loss' && data.lossProducts.length > 0 ? (
                        data.lossProducts.map((item, idx) => (
                            <tr key={idx}>
                                <td className="ps-4 fw-bold text-body">{item.product_name}</td>
                                <td className="text-center">{item.sold}</td>
                                <td className="text-end text-muted">{formatRupiah(item.modal)}</td>
                                <td className="text-end text-muted">{formatRupiah(item.harga_jual)}</td>
                                <td className="text-end pe-4 text-danger fw-bold">-{formatRupiah(item.rugi)}</td>
                            </tr>
                        ))
                    ) : type === 'loss' ? (
                        <tr><td colSpan="5" className="text-center py-4">Tidak ada barang yang dijual rugi. Mantap!</td></tr>
                    ) : null}

                    {type === 'profit' && data.products.length > 0 ? (
                        data.products.map((item, idx) => (
                            <tr key={idx}>
                                <td className="ps-4 fw-bold text-body">{item.product_name}</td>
                                <td className="text-center">{item.sold}</td>
                                <td className="text-end text-muted">{formatRupiah(item.revenue)}</td>
                                <td className="text-center text-primary fw-bold">{item.margin}</td>
                                <td className="text-end pe-4 text-success fw-bold">{formatRupiah(item.laba)}</td>
                            </tr>
                        ))
                    ) : type === 'profit' ? (
                        <tr><td colSpan="5" className="text-center py-4">Belum ada data penjualan.</td></tr>
                    ) : null}

                    {type === 'transaction' && (
                        <>
                            <tr>
                                <td className="ps-4 fw-bold text-success"><i className="fas fa-check-circle me-2"></i>Berhasil (Success)</td>
                                <td className="text-end pe-4 fw-bold text-body">{data.status_breakdown?.success || 0}</td>
                            </tr>
                            <tr>
                                <td className="ps-4 fw-bold text-warning"><i className="fas fa-clock me-2"></i>Tertunda (Pending)</td>
                                <td className="text-end pe-4 fw-bold text-body">{data.status_breakdown?.pending || 0}</td>
                            </tr>
                            <tr>
                                <td className="ps-4 fw-bold text-danger"><i className="fas fa-times-circle me-2"></i>Dibatalkan (Cancelled)</td>
                                <td className="text-end pe-4 fw-bold text-body">{data.status_breakdown?.cancelled || 0}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// L3-02: CSV export (client-side) — data sudah ada di state, tidak perlu endpoint baru
function exportSpoilageCSV(logs) {
    if (!logs || logs.length === 0) return;
    const header = ['Nama Produk', 'Total Qty Musnahkan', 'Jumlah Kejadian', 'Total Kerugian (Rp)', 'Terakhir Dimusnahkan'];
    const rows = logs.map(log => [
        `"${(log.product_name || '').replace(/"/g, '""')}"`,  // escape double-quotes
        log.total_qty,
        log.event_count,
        log.total_loss,
        log.last_destroyed_at ? new Date(log.last_destroyed_at).toLocaleDateString('id-ID') : '-'
    ]);
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM untuk Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kerugian-kedaluwarsa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// FIX (SPOILAGE-01 + L1-03 + L3-02): Komponen tabel kerugian kedaluwarsa
// Data sekarang GROUPED by product (top 50) — anti-DOM-explosion
function SpoilageContent({ data }) {
    const logs = data.spoilageLogs || [];
    return (
        <div>
            {/* L3-02: Tombol export di atas tabel */}
            {logs.length > 0 && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <small className="text-muted">
                        <i className="fas fa-layer-group me-1"></i>
                        Top {logs.length} produk (dikelompokkan berdasarkan total kerugian)
                    </small>
                    <button
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '12px' }}
                        onClick={() => exportSpoilageCSV(logs)}
                        title="Download data sebagai file CSV untuk dibuka di Excel"
                    >
                        <i className="fas fa-download"></i> Download CSV
                    </button>
                </div>
            )}
            <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                    <thead className="table-secondary">
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Nama Produk</th>
                            <th className="text-center">Qty Musnahkan</th>
                            <th className="text-center">Kejadian</th>
                            <th className="text-end">Total Kerugian</th>
                            <th className="text-end pe-4">Terakhir Dimusnahkan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map((log, idx) => (
                            <tr key={idx}>
                                <td className="ps-4 fw-bold text-body">{log.product_name}</td>
                                {/* L1-03: total_qty = SUM grouped, bukan qty per event */}
                                <td className="text-center text-secondary">{(log.total_qty || 0).toLocaleString('id-ID')} unit</td>
                                <td className="text-center">
                                    <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger" style={{fontSize: '11px'}}>
                                        {log.event_count}x
                                    </span>
                                </td>
                                <td className="text-end text-danger fw-bold">-{formatRupiah(log.total_loss)}</td>
                                <td className="text-end pe-4 text-muted small">
                                    {log.last_destroyed_at
                                        ? new Date(log.last_destroyed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '-'
                                    }
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-5">
                                    <div className="mb-2"><i className="fas fa-check-circle text-success" style={{fontSize: '2rem'}}></i></div>
                                    <p className="fw-bold text-success mb-1">Hebat! Tidak ada stok yang dimusnahkan.</p>
                                    <p className="text-muted small mb-0">Manajemen stok berjalan optimal di periode ini. 🎉</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// L2-02: Color coding yang benar — Orange untuk keputusan bisnis, Merah untuk uang hangus
const MODAL_THEMES = {
    loss:        { bg: 'bg-warning',  icon: 'fa-tag' },          // Defisit Markdown = keputusan disengaja (orange)
    transaction: { bg: 'bg-primary',  icon: 'fa-receipt' },
    pnl:         { bg: 'bg-dark',     icon: 'fa-calculator' },
    profit:      { bg: 'bg-success',  icon: 'fa-trophy' },
    spoilage:    { bg: 'bg-danger',   icon: 'fa-trash-alt' }     // Kedaluwarsa = uang hangus absolut (merah)
};

/**
 * Komponen modal utama
 * @param {{ modalConfig, closeModal, data, ringkasan }} props
 */
export default function BiAnalyticsModal({ modalConfig, closeModal, data, ringkasan }) {
    if (!modalConfig.isOpen) return null;

    const theme = MODAL_THEMES[modalConfig.type] || MODAL_THEMES.profit;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className={`modal-header text-white ${theme.bg}`}>
                        <h5 className="modal-title fw-bold">
                            <i className={`fas ${theme.icon} me-2`}></i>
                            {modalConfig.title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                    </div>
                    
                    <div className="modal-body p-0">
                        {modalConfig.type === 'pnl' ? (
                            <PnlContent ringkasan={ringkasan} />
                        ) : modalConfig.type === 'spoilage' ? (
                            // FIX (SPOILAGE-01): Render tabel rincian pemusnahan stok
                            <SpoilageContent data={data} />
                        ) : (
                            <TableContent type={modalConfig.type} data={data} />
                        )}
                    </div>
                    <div className="modal-footer bg-body border-0">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
