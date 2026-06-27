import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TrendChart from '../components/TrendChart';
import BiAnalyticsModal from '../components/BiAnalyticsModal';
import { apiFetch, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';
import ErrorMessage from '../components/ErrorMessage';
function BiAnalytics() {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // PERFORMANCE FIX (F-T06): Pisahkan input state (UI) dari applied state (API)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');
    
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        type: null 
    });

    const [data, setData] = useState({
        summary: {},
        status_breakdown: {},
        products: [],
        monthly: [],
        profit: {},
        lossProducts: [],
        spoilageLogs: []   // FIX (SPOILAGE-01): Log pemusnahan stok expired
    });

    // Debounce: Tunda penerapan filter 500ms setelah user berhenti mengetik
    const debounceRef = useRef(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedStartDate(startDate);
            setAppliedEndDate(endDate);
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [startDate, endDate]);

    // API call hanya terpicu oleh applied state (setelah debounce selesai)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (appliedStartDate) params.append('startDate', appliedStartDate);
                if (appliedEndDate) params.append('endDate', appliedEndDate);

                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=10` : '?limit=10';

                const [summaryRes, topProductsRes, monthlyRes, profitRes, lossProductsRes, spoilageRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/analytics/top-product${topProductQuery}`),
                    apiFetch(`/analytics/monthly${query}`),
                    apiFetch(`/analytics/profit${query}`),
                    apiFetch(`/analytics/loss-products${topProductQuery}`),
                    // FIX (SPOILAGE-01): Ambil log pemusnahan stok expired
                    apiFetch(`/analytics/spoilage-log${query}`)
                ]);

                setData({
                    summary: summaryRes.summary,
                    status_breakdown: summaryRes.status_breakdown,
                    products: topProductsRes,
                    monthly: monthlyRes,
                    profit: profitRes,
                    lossProducts: lossProductsRes,
                    spoilageLogs: Array.isArray(spoilageRes) ? spoilageRes : []
                });
            } catch (err) {
                setError(formatError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [appliedStartDate, appliedEndDate]);

    const ringkasan = {
        penjualan:    data.summary.revenue      || 0,
        labaKotor:    data.summary.total_profit || 0,
        transaksi:    data.summary.total_transaction || 0,
        rugi:         data.profit.sell_loss     || 0,  // Defisit Markdown (jual di bawah modal)
        spoilage:     data.profit.spoilage_loss || 0,  // Kerugian kedaluwarsa
        totalLoss:    data.profit.total_loss    || 0,  // Gabungan kedua sumber
        labaBersih:   data.profit.net_income    || 0,
        margin:       data.profit.profit_margin || '0%',
        qtyDestroyed: data.profit.qty_destroyed || 0
    };

    // L2-03: Hitung persentase terhadap omzet (hindari divisi by zero)
    const pctOfOmzet = (nilai) => {
        if (!ringkasan.penjualan || !nilai) return null;
        return ((nilai / ringkasan.penjualan) * 100).toFixed(1);
    };

    // L2-04: Label periode yang aktif (konteks data untuk owner)
    const formatPeriodLabel = () => {
        if (!appliedStartDate && !appliedEndDate) return 'Sepanjang Waktu';
        const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        const fmt = (d) => {
            const [y, m, dd] = d.split('-');
            return `${parseInt(dd)} ${monthNames[parseInt(m)-1]}`;
        };
        if (appliedStartDate && appliedEndDate) return `${fmt(appliedStartDate)} – ${fmt(appliedEndDate)}`;
        if (appliedStartDate) return `Sejak ${fmt(appliedStartDate)}`;
        return `s/d ${fmt(appliedEndDate)}`;
    };
    const periodLabel = formatPeriodLabel();
    const isAllTime = !appliedStartDate && !appliedEndDate;


    const trend = useMemo(() => {
        if (!data.monthly || data.monthly.length === 0) return { labels: [], data: [], laba: [] };
        return {
            labels: data.monthly.map(m => {
                const [year, month] = m.month.split('-');
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                return `${monthNames[parseInt(month)-1]} ${year}`;
            }),
            data: data.monthly.map(m => m.revenue),
            laba: data.monthly.map(m => m.laba_bersih) 
        };
    }, [data.monthly]);

    const performa = data.products.map(p => ({
        nama: p.product_name,
        volume: p.sold,
        laba: p.laba,
        margin: p.margin 
    }));

    const openModal = (type) => {
        let title = '';
        if (type === 'loss')         title = 'Rincian Defisit Markdown (Jual di Bawah Modal)';
        else if (type === 'profit')      title = 'Rincian Penyumbang Laba';
        else if (type === 'transaction') title = 'Rincian Status Transaksi';
        else if (type === 'pnl')         title = 'Kalkulasi Laba Rugi (P&L)';
        else if (type === 'spoilage')    title = `Rincian Kerugian Kedaluwarsa — ${periodLabel}`;

        setModalConfig({ isOpen: true, title, type });
    };

    const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat data BI...</p></div>;
    if (error) return <ErrorMessage error={error} />;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Analitik Bisnis (BI)</h3>
                <div className="d-flex gap-2">
                    <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span className="mt-1">-</span>
                    <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </div>
            
            <div className="row g-4">
                <div className="col-lg-4 col-md-5">
                    {/* --- SUMMARY PENJUALAN --- */}
                    <div className="mb-4">
                        <div className="mt-2">
                            <span className="badge bg-secondary mb-2">Sales Summary</span>
                        </div>
                        
                        {/* KARTU TOTAL PENDAPATAN (Sekarang Statis / Non-clickable) */}
                        <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">Total Pendapatan</small>
                                    <div className="h4 fw-bold text-body mb-0">{formatRupiah(ringkasan.penjualan)}</div>
                                </div>
                                {/* Ikon dompet sebagai dekorasi pengganti panah */}
                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                    <i className="fas fa-wallet text-success" style={{ fontSize: '18px' }}></i>
                                </div>
                            </div>
                        </div>
                        
                        {/* KARTU TRANSAKSI */}
                        <div 
                            className="card border-0 shadow-sm rounded-4 p-3 mb-3"
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => openModal('transaction')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">Jumlah Transaksi</small>
                                    <div className="h4 fw-bold text-body mb-0">{ringkasan.transaksi.toLocaleString('id-ID')}</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </div>

                    </div>

                    <div className="mb-4">
                        {/* L2-04: Badge periode aktif — beri konteks data Risk Management */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge bg-danger bg-opacity-75">Risk Management</span>
                            <span 
                                className="badge rounded-pill" 
                                style={{ 
                                    fontSize: '10px', 
                                    backgroundColor: isAllTime ? '#f59e0b20' : '#dbeafe', 
                                    color: isAllTime ? '#92400e' : '#1e40af', 
                                    border: isAllTime ? '1px solid #f59e0b40' : '1px solid #bfdbfe'
                                }}
                            >
                                📅 {periodLabel}
                            </span>
                        </div>

                        {/* L2-01: "Defisit Markdown" — re-label dari "Kerugian (Jual Rugi)" */}
                        {/* L2-02: Orange/warning (keputusan bisnis disengaja), L2-05: hijau jika Rp 0 */}
                        <div 
                            className="card border-0 shadow-sm rounded-4 p-3 mb-3"
                            style={{ 
                                cursor: 'pointer', 
                                transition: '0.2s'
                            }}
                            onClick={() => openModal('loss')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div style={{ flex: 1 }}>
                                    {/* L2-01: Nama baru + Tooltip penjelasan */}
                                    <div className="d-flex align-items-center gap-1">
                                        <small className="fw-bold" style={{ color: ringkasan.rugi === 0 ? '#16a34a' : '#b45309' }}>
                                            {ringkasan.rugi === 0 ? '✅' : '💸'} Defisit Markdown
                                        </small>
                                        {/* L1-03: Tooltip sumber data */}
                                        <span 
                                            title="Total kerugian dari produk yang sengaja dijual di bawah harga modal (via Smart Expiry Markdown). Bukan kesalahan kasir."
                                            style={{ cursor: 'help', fontSize: '11px', color: '#9ca3af' }}
                                        >ℹ️</span>
                                    </div>
                                    {/* L2-05: Zero-loss psychology */}
                                    {ringkasan.rugi === 0 ? (
                                        <div className="fw-bold text-success mt-1 mb-0" style={{ fontSize: '14px' }}>Hebat! Tidak ada defisit di periode ini.</div>
                                    ) : (
                                        <>
                                            <div className="h4 fw-bold mt-1 mb-0" style={{ color: '#b45309' }}>{formatRupiah(ringkasan.rugi)}</div>
                                            {/* L2-03: Persentase terhadap omzet */}
                                            {pctOfOmzet(ringkasan.rugi) && (
                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                    ({pctOfOmzet(ringkasan.rugi)}% dari Total Omzet)
                                                </small>
                                            )}
                                        </>
                                    )}
                                </div>
                                <i className="fas fa-chevron-right text-muted opacity-50"></i>
                            </div>
                            <small className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>Klik untuk lihat rincian — subsidi harga agar produk terjual sebelum expired</small>
                        </div>

                        {/* L2-02: Kerugian Kedaluwarsa — MERAH (uang hangus total) */}
                        {/* L2-05: Hijau jika Rp 0, L2-03: % omzet, L2-04: sudah ada badge periode di atas */}
                        <div 
                            className="card border-0 shadow-sm rounded-4 p-3 mb-3"
                            style={{ 
                                cursor: 'pointer', 
                                transition: '0.2s'
                            }}
                            onClick={() => openModal('spoilage')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div style={{ flex: 1 }}>
                                    <small className="fw-bold" style={{ color: ringkasan.spoilage === 0 ? '#16a34a' : '#dc2626' }}>
                                        {ringkasan.spoilage === 0 ? '✅' : '🗑️'} Kerugian Kedaluwarsa
                                    </small>
                                    {/* L2-05: Zero-loss psychology */}
                                    {ringkasan.spoilage === 0 ? (
                                        <div className="fw-bold text-success mt-1 mb-0" style={{ fontSize: '14px' }}>Hebat! Tidak ada stok kedaluwarsa.</div>
                                    ) : (
                                        <>
                                            <div className="h4 fw-bold text-danger mt-1 mb-0">{formatRupiah(ringkasan.spoilage)}</div>
                                            {/* L2-03: Persentase + unit dimusnahkan */}
                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                {ringkasan.qtyDestroyed > 0 && `${ringkasan.qtyDestroyed.toLocaleString('id-ID')} unit dimusnahkan`}
                                                {ringkasan.qtyDestroyed > 0 && pctOfOmzet(ringkasan.spoilage) && ' • '}
                                                {pctOfOmzet(ringkasan.spoilage) && `${pctOfOmzet(ringkasan.spoilage)}% dari Omzet`}
                                            </small>
                                        </>
                                    )}
                                </div>
                                <i className="fas fa-chevron-right text-muted opacity-50"></i>
                            </div>
                            <small className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>Modal hilang sepenuhnya — klik untuk lihat produk bermasalah</small>
                        </div>
                    </div>

                    {/* --- PROFIT TRACKING --- */}
                    <div className="mb-3">
                        <span className="badge bg-primary mb-2">Profit & Loss Tracking</span>
                        
                        {/* KARTU SUPER: LAPORAN LABA */}
                        <div 
                            className="card border-0 shadow-sm rounded-4 p-3 mb-3"
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => openModal('pnl')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">Laporan Laba</small>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                        <div className="h4 fw-bold text-success mb-0">{formatRupiah(ringkasan.labaBersih)}</div>
                                        <span 
                                            className="d-inline-flex align-items-center justify-content-center" 
                                            style={{ 
                                                fontSize: '0.75rem', color: '#0369a1', backgroundColor: '#e0f2fe', 
                                                padding: '0.25rem 0.6rem', borderRadius: '1rem', fontWeight: '600',
                                                border: '1px solid #bae6fd'
                                            }}
                                        >
                                            <i className="fas fa-arrow-trend-up me-1"></i> {ringkasan.margin} Margin
                                        </span>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right text-muted opacity-50"></i>
                            </div>
                            <small className="text-muted mt-2 d-block" style={{ fontSize: "11px" }}>Klik untuk melihat rincian kalkulasi P&L</small>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8 col-md-7">
                    <ul className="nav nav-pills mb-4 card border-0 p-2 rounded-4 shadow-sm d-flex flex-row flex-wrap gap-2">
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'list' ? 'active' : ''}`} type="button" onClick={() => setView('list')}>
                                <i className="fas fa-boxes me-2" />Performa Penjualan
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'chart' ? 'active' : ''}`} type="button" onClick={() => setView('chart')}>
                                <i className="fas fa-chart-area me-2" />Analisis Tren
                            </button>
                        </li>
                    </ul>

                    {view === 'list' && (
                        <div className="card border-0 shadow-sm p-4 rounded-4">
                            <h5 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Performa Penjualan Barang</h5>
                            <div className="table-responsive" style={{ maxHeight: "390px", overflowY: "auto", paddingRight: "5px" }}>
                                <table className="table table-borderless align-middle mb-0">
                                    <thead style={{ position: "sticky", top: 0, zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <tr className="small text-muted text-uppercase">
                                            <th>Nama Barang</th>
                                            <th className="text-center">Volume</th>
                                            <th className="text-center">Margin</th>
                                            <th className="text-end">Total Laba</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performa.length > 0 ? performa.map((item) => (
                                            <tr key={item.nama}>
                                                <td><div className="fw-bold text-body">{item.nama}</div></td>
                                                <td className="text-center text-secondary">{item.volume.toLocaleString('id-ID')} unit</td>
                                                <td className="text-center text-primary fw-bold">{item.margin}</td>
                                                <td className="text-end text-success fw-bold">{formatRupiah(item.laba)}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5">
                                                    <div className="mb-3"><i className="fas fa-chart-pie text-muted opacity-50" style={{ fontSize: '3rem' }}></i></div>
                                                    <h6 className="fw-bold text-body">Tidak Ada Data Penjualan</h6>
                                                    <p className="text-muted small mb-3">Sistem belum dapat menyusun performa barang.</p>
                                                    <button 
                                                        onClick={() => navigate('/transaction')} 
                                                        className="btn btn-outline-primary btn-sm px-4 rounded-pill"
                                                    >
                                                        Lihat Transaksi
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'chart' && (
                        <div className="card border-0 shadow-sm p-4 rounded-4">
                            <div className="mb-4">
                                <h5 className="fw-bold"><span className="badge bg-info me-2">Tren</span>Grafik Penjualan & Laba</h5>
                                <small className="text-muted">Menampilkan perbandingan total omzet dan untung bersih dari bulan ke bulan.</small>
                            </div>
                            <div className="chart-container position-relative" style={{ minHeight: '350px' }}>
                                {ringkasan.transaksi > 0 ? (
                                    <TrendChart labels={trend.labels} sales={trend.data} profit={trend.laba} salesLabel="Penjualan" />
                                ) : (
                                    <div className="d-flex flex-column justify-content-center align-items-center h-100 bg-body-tertiary rounded text-center p-4" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                        <i className="fas fa-chart-area text-muted opacity-50 mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h6 className="fw-bold text-body">Grafik Belum Tersedia</h6>
                                        <p className="text-muted small mb-0">Tren penjualan akan tergambar setelah<br/>transaksi masuk ke sistem.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- KOMPONEN MODAL (diekstrak ke BiAnalyticsModal.jsx) --- */}
            <BiAnalyticsModal 
                modalConfig={modalConfig} 
                closeModal={closeModal} 
                data={data} 
                ringkasan={ringkasan}
            />
        </>
    );
}

export default BiAnalytics;