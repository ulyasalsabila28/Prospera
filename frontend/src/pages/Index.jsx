import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ModalExport from '../components/ModalExport';
import TrendChart from '../components/TrendChart';
import SmartExpiryWidget from '../components/SmartExpiryWidget';
import { apiFetch, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function Index() {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view') || 'overview';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // PERFORMANCE FIX (F-T05): Pisahkan input state (UI) dari applied state (API)
    // Input state: berubah setiap keystroke, TIDAK memicu API call
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Applied state: berubah 500ms setelah user berhenti mengetik, MEMICU API call
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');

    const [data, setData] = useState({
        summary: {},
        products: [],
        monthly: [],
        anomalies: { timeAnomalies: [], priceAnomalies: [] },
    });

    const setView = (newView) => {
        setSearchParams({ view: newView });
    };

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
        const fetchSummaryData = async () => {
            try {
                const params = new URLSearchParams();
                if (appliedStartDate) params.append('startDate', appliedStartDate);
                if (appliedEndDate) params.append('endDate', appliedEndDate);
                
                const query = params.toString() ? `?${params.toString()}` : '';
                const [summaryRes, anomaliesRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/smart-features/anomalies`)
                ]);
                
                setData(prev => ({ ...prev, summary: summaryRes.summary, anomalies: anomaliesRes }));
            } catch (err) {
                console.error("Gagal menyegarkan summary (Event Listener):", err);
            }
        };

        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (appliedStartDate) params.append('startDate', appliedStartDate);
                if (appliedEndDate) params.append('endDate', appliedEndDate);
                
                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=10` : '?limit=10';

                const [summaryRes, topProductsRes, monthlyRes, anomaliesRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/analytics/top-product${topProductQuery}`),
                    apiFetch(`/analytics/monthly${query}`),
                    apiFetch(`/smart-features/anomalies`)
                ]);

                setData({
                    summary: summaryRes.summary,
                    products: topProductsRes,
                    monthly: monthlyRes,
                    anomalies: anomaliesRes,
                });
            } catch (err) {
                setError(formatError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        window.addEventListener('fraudDataUpdated', fetchSummaryData);
        return () => window.removeEventListener('fraudDataUpdated', fetchSummaryData);
    }, [appliedStartDate, appliedEndDate]);

    const totalProfit = data.summary.total_profit || 0;
    const totalLoss = data.summary.total_loss || 0;
    const netIncome = totalProfit - totalLoss;
    const totalSales = data.summary.revenue || 0;
    const totalTrans = data.summary.total_transaction || 0;
    const margin = totalSales > 0 ? ((netIncome / totalSales) * 100).toFixed(1) : 0;
    
    // Anomaly calculation
    const openTimeAnomalies = (data.anomalies?.timeAnomalies || []).filter(item => item.status === 'OPEN');
    const openPriceAnomalies = (data.anomalies?.priceAnomalies || []).filter(item => item.status === 'OPEN');
    const hasOpenAnomalies = openTimeAnomalies.length > 0 || openPriceAnomalies.length > 0;
    const totalOpenLoss = openPriceAnomalies.reduce((sum, item) => {
        const loss = item.capital_cost - item.selling_price;
        return sum + (loss > 0 ? loss * (item.quantity || 1) : 0);
    }, 0);
    
    // FIX: Gunakan data REAL dari API, bukan mock
    const sortedProducts = data.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        volume: p.sold,
        profit: p.laba || 0,          // Data real dari backend
        margin: p.margin || '0%',     // Data real dari backend
        current_stock: p.current_stock || 0,
        suggested_restock: p.suggested_restock || 0
    }));

    const restockSuggestions = sortedProducts.filter(p => p.suggested_restock > 0);

    // FIX: Kalkulasi Estimasi Penjualan secara logis (Average Daily Revenue * 30 Hari)
    let projectedSales = 0;
    if (appliedStartDate && appliedEndDate) {
        const start = new Date(appliedStartDate);
        const end = new Date(appliedEndDate);
        const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
        projectedSales = totalSales > 0 ? (totalSales / diffDays) * 30 : 0;
    } else {
        // Jika tidak ada filter tanggal, jangan membagi All-Time Sales!
        // Gunakan penjualan 1 bulan terakhir saja sebagai base estimasi 30 hari ke depan
        projectedSales = data.monthly.length > 0 ? parseFloat(data.monthly[data.monthly.length - 1].revenue) || 0 : 0;
    }

    // FIX: Gunakan laba_bersih real dari API, bukan mock 40%
    const chartData = useMemo(() => {
        return {
            labels: data.monthly.map(m => m.month),
            sales: data.monthly.map(m => m.revenue),
            profit: data.monthly.map(m => m.laba_bersih || 0),
        };
    }, [data.monthly]);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat data analisis...</p></div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}. Pastikan Anda sudah login dan server backend berjalan.</div>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Laporan Analisis Bisnis</h3>
                <div className="d-flex gap-2">
                    <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <span className="mt-1">-</span>
                    <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-4 col-md-5">
                    <div className="mb-4" data-tour="tour-sales-summary">
                        <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                            <span className="badge bg-secondary rounded-pill px-3 py-2">Sales Summary</span>
                            <button className="btn btn-sm btn-outline-primary px-3 fw-semibold rounded-pill" type="button" data-bs-toggle="modal" data-bs-target="#ModalExport">
                                <i className="fas fa-file-export me-1" />Export
                            </button>
                        </div>
                        
                        <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center">
                            <div>
                                <div className="text-muted small mb-1">Total Pendapatan</div>
                                <div className="h4 fw-bold m-0 text-body">{formatRupiah(totalSales)}</div>
                            </div>
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                                <i className="fas fa-wallet fs-5"></i>
                            </div>
                        </div>

                        <Link to="/bi-analytics" className="text-decoration-none text-body">
                            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                <div>
                                    <div className="text-muted small mb-1">Jumlah Transaksi</div>
                                    <div className="h4 fw-bold m-0 text-body">{totalTrans.toLocaleString('id-ID')}</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </Link>
                    </div>

                    <div className="mb-3">
                        <span className="badge bg-danger bg-opacity-75 rounded-pill px-3 py-2 mb-2">Risk Management</span>
                        <div data-tour="tour-fraud">
                            <Link to="/smart-predict" className="text-decoration-none text-body">
                            {hasOpenAnomalies ? (
                                <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                    <div>
                                        <div className="fw-bold text-body mb-1">Deteksi Anomali / Fraud</div>
                                        {totalOpenLoss > 0 ? (
                                            <div className="h4 fw-bold text-danger m-0">{formatRupiah(totalOpenLoss)}</div>
                                        ) : (
                                            <div className="h5 fw-bold text-warning m-0">{openTimeAnomalies.length} Kasus Waktu</div>
                                        )}
                                        <div className="text-muted small mt-1">Klik untuk melihat detail anomali</div>
                                    </div>
                                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                                        <i className="fas fa-exclamation-triangle fs-5"></i>
                                    </div>
                                </div>
                            ) : (
                                <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                    <div>
                                        <div className="fw-bold text-body mb-1">Deteksi Anomali / Fraud</div>
                                        <div className="h5 fw-bold text-success m-0">Aman & Terkendali</div>
                                        <div className="text-muted small mt-1">Klik untuk melihat riwayat audit</div>
                                    </div>
                                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                                        <i className="fas fa-shield-alt fs-5"></i>
                                    </div>
                                </div>
                            )}
                            </Link>
                        </div>
                        <div data-tour="tour-expiry" className="mt-2">
                            <SmartExpiryWidget isDashboard={true} />
                        </div>
                    </div>

                    <div className="mb-3">
                        <span className="badge bg-primary rounded-pill px-3 py-2 mb-2">Profit & Loss Tracking</span>
                        
                        <Link to="/bi-analytics" className="text-decoration-none text-body">
                            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                <div>
                                    <div className="text-muted small mb-1">Laba Bersih</div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="h4 fw-bold text-success m-0">{formatRupiah(netIncome)}</div>
                                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill border border-info border-opacity-25 px-2 py-1">
                                            <i className="fas fa-arrow-trend-up me-1"></i>{margin}% Margin
                                        </span>
                                    </div>
                                    <div className="text-muted small mt-2">Klik untuk melihat rincian kalkulasi P&L</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="col-lg-8 col-md-7 d-flex flex-column">
                    <ul className="nav nav-pills mb-4 bg-body p-2 rounded shadow-sm">
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'overview' ? 'active' : ''}`} type="button" onClick={() => setView('overview')}>
                                <i className="fas fa-list me-2" />Performa Produk
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'chart' ? 'active' : ''}`} type="button" onClick={() => setView('chart')}>
                                <i className="fas fa-chart-line me-2" />Grafik Analisis
                            </button>
                        </li>
                    </ul>

                    {view === 'overview' ? (
                        <div className="clean-card shadow-sm mb-3">
                            <h6 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Top Performance Produk</h6>
                            <div style={{ maxHeight: "290px", overflowY: "auto", paddingRight: "5px" }}>
                                <div className="table-responsive">
                                    <table className="table table-simple align-middle mb-0">
                                        <thead style={{ position: "sticky", top: 0, zIndex: 1 }} className="bg-body">
                                            <tr>
                                                <th>Produk</th>
                                                <th>Unit</th>
                                                <th>Laba</th>
                                                <th>Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="border-top-0">
                                            {sortedProducts.length > 0 ? sortedProducts.map((product) => (
                                                <tr key={product.id} className="align-middle">
                                                    <td className="fw-bold text-body">{product.name}</td>
                                                    <td>{product.volume.toLocaleString('id-ID')} unit</td>
                                                    <td className="text-success fw-bold">{formatRupiah(product.profit)}</td>
                                                    <td>
                                                        <span className="text-primary fw-bold">
                                                            {product.margin}
                                                        </span>
                                                    </td>
                                                </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5">
                                                    <div className="mb-3"><i className="fas fa-box-open text-muted opacity-50" style={{ fontSize: '3rem' }}></i></div>
                                                    <h6 className="fw-bold text-body">Belum Ada Transaksi</h6>
                                                    <p className="text-muted small mb-3">Catat transaksi pertama Anda untuk melihat performa produk.</p>
                                                    <Link to="/transaction" className="btn btn-primary btn-sm px-4 rounded-pill">Catat Transaksi</Link>
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    ) : (
                        <div className="clean-card shadow-sm mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0"><span className="badge bg-info me-2">Tren</span>Tren Bisnis</h6>
                            </div>
                            <div className="chart-area position-relative">
                                {totalTrans > 0 ? (
                                    <TrendChart labels={chartData.labels} sales={chartData.sales} profit={chartData.profit} />
                                ) : (
                                    <div className="d-flex flex-column justify-content-center align-items-center h-100 bg-body-tertiary rounded text-center p-4">
                                        <i className="fas fa-chart-line text-muted opacity-50 mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h6 className="fw-bold text-body">Grafik Belum Tersedia</h6>
                                        <p className="text-muted small mb-0">Grafik analisis akan terbentuk secara otomatis<br/>setelah ada data penjualan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto" data-tour="tour-ai-insight">
                        <Link to="/smart-predict" className="text-decoration-none text-body">
                            <div className="card shadow-sm rounded-4 p-4 border-0 card-hover-effect">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold m-0"><i className="fas fa-robot text-primary me-2" />AI Insight</h6>
                                    <div className="d-flex align-items-center text-primary small fw-bold">
                                        Buka Fitur Pintar <i className="fas fa-arrow-right ms-2"></i>
                                    </div>
                                </div>
                                <div className="row align-items-center">
                                    <div className="col-md-4 border-end">
                                        <small className="text-muted d-block mb-1">Estimasi Penjualan</small>
                                        <div className="h4 fw-bold text-primary m-0">{formatRupiah(projectedSales)}</div>
                                    </div>
                                    <div className="col-md-8 ps-md-4">
                                        <small className="text-muted d-block mb-2">Saran Stok Otomatis:</small>
                                        <div className="small text-secondary d-flex flex-wrap gap-2 mt-2">
                                            {restockSuggestions.length > 0 ? restockSuggestions.slice(0, 4).map((product) => (
                                                <span className="badge bg-body border text-body px-2 py-1 rounded-pill shadow-sm" key={product.id} title={`Sisa Stok: ${product.current_stock}`}>
                                                    {product.name} <span className="text-success ms-1 fw-bold">+{product.suggested_restock}</span>
                                                </span>
                                            )) : (
                                                <div className="fst-italic text-muted"><i className="fas fa-check-circle text-success me-1"></i>Stok seluruh {sortedProducts.length > 0 ? 'Top Produk' : 'barang'} aman.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <ModalExport />
        </>
    );
}

export default Index;
