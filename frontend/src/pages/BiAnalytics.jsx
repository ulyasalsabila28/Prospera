import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TrendChart from '../components/TrendChart';
import { apiFetch } from '../utils/api';
import { formatRupiah } from '../utils/format';

function BiAnalytics() {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
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
        lossProducts: [] 
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);

                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=10` : '?limit=10';

                const [summaryRes, topProductsRes, monthlyRes, profitRes, lossProductsRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/analytics/top-product${topProductQuery}`),
                    apiFetch(`/analytics/monthly${query}`),
                    apiFetch(`/analytics/profit${query}`),
                    apiFetch(`/analytics/loss-products${topProductQuery}`) 
                ]);

                setData({
                    summary: summaryRes.summary,
                    status_breakdown: summaryRes.status_breakdown,
                    products: topProductsRes,
                    monthly: monthlyRes,
                    profit: profitRes,
                    lossProducts: lossProductsRes 
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const ringkasan = {
        penjualan: data.summary.revenue || 0,
        labaKotor: data.summary.total_profit || 0,
        transaksi: data.summary.total_transaction || 0,
        rugi: data.profit.total_loss || 0,
        labaBersih: data.profit.net_income || 0,
        margin: data.profit.profit_margin || '0%'
    };

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
        if (type === 'loss') title = 'Rincian Barang Rugi';
        else if (type === 'profit') title = 'Rincian Penyumbang Laba';
        else if (type === 'transaction') title = 'Rincian Status Transaksi';
        else if (type === 'pnl') title = 'Kalkulasi Laba Rugi (P&L)'; 

        setModalConfig({
            isOpen: true,
            title: title,
            type: type
        });
    };

    const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat data BI...</p></div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}. Pastikan Anda sudah login dan server backend berjalan.</div>;

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
                        <span className="badge bg-secondary mb-2">Sales Summary</span>
                        
                        {/* KARTU TOTAL PENDAPATAN (Sekarang Statis / Non-clickable) */}
                        <div className="stat-card bi-card shadow-sm mb-2 bg-white rounded border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">Total Pendapatan</small>
                                    <div className="h4 fw-bold text-dark mb-0">{formatRupiah(ringkasan.penjualan)}</div>
                                </div>
                                {/* Ikon dompet sebagai dekorasi pengganti panah */}
                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                    <i className="fas fa-wallet text-success" style={{ fontSize: '14px' }}></i>
                                </div>
                            </div>
                        </div>
                        
                        {/* KARTU TRANSAKSI */}
                        <div 
                            className="stat-card bi-card shadow-sm mb-2 bg-white rounded border-0"
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => openModal('transaction')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">Jumlah Transaksi</small>
                                    <div className="h4 fw-bold text-dark mb-0">{ringkasan.transaksi.toLocaleString('id-ID')}</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted opacity-50"></i>
                            </div>
                        </div>

                        {/* KARTU KERUGIAN */}
                        <div 
                            className="stat-card bi-card shadow-sm mt-3 bg-white rounded border-0"
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => openModal('loss')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted fw-bold">Kerugian (Jual Rugi)</small>
                                    <div className="h4 fw-bold text-danger mt-1 mb-0">{formatRupiah(ringkasan.rugi)}</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted opacity-50"></i>
                            </div>
                            <small className="text-muted mt-2 d-block" style={{ fontSize: "11px" }}>Klik untuk melihat rincian barang rugi</small>
                        </div>
                    </div>

                    {/* --- PROFIT TRACKING --- */}
                    <div className="mb-3">
                        <span className="badge bg-primary mb-2">Profit & Loss Tracking</span>
                        
                        {/* KARTU SUPER: LAPORAN LABA */}
                        <div 
                            className="stat-card bi-card shadow-sm mb-2 bg-white rounded border-0"
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
                    <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm d-flex flex-wrap gap-2 border-0">
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
                        <div className="card border-0 shadow-sm p-4 bg-white rounded">
                            <h5 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Performa Penjualan Barang</h5>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle">
                                    <thead className="bg-light">
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
                                                <td><div className="fw-bold text-dark">{item.nama}</div></td>
                                                <td className="text-center text-secondary">{item.volume.toLocaleString('id-ID')} unit</td>
                                                <td className="text-center text-primary fw-bold">{item.margin}</td>
                                                <td className="text-end text-success fw-bold">{formatRupiah(item.laba)}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="text-center text-muted py-4">Belum ada data penjualan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'chart' && (
                        <div className="card border-0 shadow-sm p-4 bg-white rounded h-100">
                            <div className="mb-4">
                                <h5 className="fw-bold"><span className="badge bg-info me-2">Tren</span>Grafik Penjualan & Laba</h5>
                                <small className="text-muted">Menampilkan perbandingan total omzet dan untung bersih dari bulan ke bulan.</small>
                            </div>
                            <div className="chart-container" style={{ height: '100%', minHeight: '300px' }}>
                                <TrendChart labels={trend.labels} sales={trend.data} profit={trend.laba} salesLabel="Penjualan" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- KOMPONEN POP-UP (MODAL) --- */}
            {modalConfig.isOpen && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className={`modal-header text-white ${
                                modalConfig.type === 'loss' ? 'bg-danger' : 
                                modalConfig.type === 'transaction' ? 'bg-primary' : 
                                modalConfig.type === 'pnl' ? 'bg-dark' : 'bg-success'
                            }`}>
                                <h5 className="modal-title fw-bold">
                                    <i className={`fas ${
                                        modalConfig.type === 'loss' ? 'fa-exclamation-triangle' : 
                                        modalConfig.type === 'transaction' ? 'fa-receipt' : 
                                        modalConfig.type === 'pnl' ? 'fa-calculator' : 'fa-trophy'
                                    } me-2`}></i>
                                    {modalConfig.title}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            
                            <div className="modal-body p-0">
                                {/* JIKA YANG DIBUKA ADALAH LAPORAN P&L */}
                                {modalConfig.type === 'pnl' ? (
                                    <div className="p-4 bg-white">
                                        <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <span className="d-block text-muted mb-1" style={{fontSize: "14px"}}>Total Pendapatan Kotor (Omzet)</span>
                                            <span className="fw-bold text-dark" style={{fontSize: "20px"}}>{formatRupiah(ringkasan.penjualan)}</span>
                                        </div>
                                        
                                        <h6 className="fw-bold text-secondary mb-3"><i className="fas fa-list me-2"></i>Rincian Kalkulasi:</h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted" style={{fontSize: "16px"}}>Laba Kotor (Untung)</span>
                                            <span className="fw-bold text-success" style={{fontSize: "16px"}}>{formatRupiah(ringkasan.labaKotor)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-2">
                                            <span className="text-muted" style={{fontSize: "16px"}}>Kerugian (Jual Rugi)</span>
                                            <span className="fw-bold text-danger" style={{fontSize: "16px"}}>-{formatRupiah(ringkasan.rugi)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mt-3">
                                            <span className="fw-bold text-dark" style={{ fontSize: "1.2rem" }}>Total Laba Bersih</span>
                                            <span className="fw-bold text-primary" style={{ fontSize: "1.2rem" }}>{formatRupiah(ringkasan.labaBersih)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    /* JIKA YANG DIBUKA ADALAH TABEL */
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                {modalConfig.type === 'loss' ? (
                                                    <tr className="small text-muted text-uppercase">
                                                        <th className="ps-4">Nama Barang</th>
                                                        <th className="text-center">Vol</th>
                                                        <th className="text-end">Modal/Unit</th>
                                                        <th className="text-end">Jual/Unit</th>
                                                        <th className="text-end pe-4">Total Rugi</th>
                                                    </tr>
                                                ) : modalConfig.type === 'profit' ? (
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
                                                {modalConfig.type === 'loss' && data.lossProducts.length > 0 ? (
                                                    data.lossProducts.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="ps-4 fw-bold text-dark">{item.product_name}</td>
                                                            <td className="text-center">{item.sold}</td>
                                                            <td className="text-end text-muted">{formatRupiah(item.modal)}</td>
                                                            <td className="text-end text-muted">{formatRupiah(item.harga_jual)}</td>
                                                            <td className="text-end pe-4 text-danger fw-bold">-{formatRupiah(item.rugi)}</td>
                                                        </tr>
                                                    ))
                                                ) : modalConfig.type === 'loss' ? (
                                                    <tr><td colSpan="5" className="text-center py-4">Tidak ada barang yang dijual rugi. Mantap!</td></tr>
                                                ) : null}

                                                {modalConfig.type === 'profit' && data.products.length > 0 ? (
                                                    data.products.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="ps-4 fw-bold text-dark">{item.product_name}</td>
                                                            <td className="text-center">{item.sold}</td>
                                                            <td className="text-end text-muted">{formatRupiah(item.revenue)}</td>
                                                            <td className="text-center text-primary fw-bold">{item.margin}</td>
                                                            <td className="text-end pe-4 text-success fw-bold">{formatRupiah(item.laba)}</td>
                                                        </tr>
                                                    ))
                                                ) : modalConfig.type === 'profit' ? (
                                                    <tr><td colSpan="5" className="text-center py-4">Belum ada data penjualan.</td></tr>
                                                ) : null}

                                                {modalConfig.type === 'transaction' && (
                                                    <>
                                                        <tr>
                                                            <td className="ps-4 fw-bold text-success"><i className="fas fa-check-circle me-2"></i>Berhasil (Success)</td>
                                                            <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.success || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="ps-4 fw-bold text-warning"><i className="fas fa-clock me-2"></i>Tertunda (Pending)</td>
                                                            <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.pending || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="ps-4 fw-bold text-danger"><i className="fas fa-times-circle me-2"></i>Dibatalkan (Cancelled)</td>
                                                            <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.cancelled || 0}</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BiAnalytics;