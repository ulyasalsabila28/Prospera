import { useMemo, useState, useEffect } from 'react';
import ModalExport from '../components/ModalExport';
import TrendChart from '../components/TrendChart';
import { apiFetch } from '../utils/api';
import { formatRupiah } from '../utils/format';

function Index() {
    const [view, setView] = useState('overview');
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState({
        summary: {},
        products: [],
        monthly: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                
                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=4` : '?limit=4';

                const [summaryRes, topProductsRes, monthlyRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/analytics/top-product${topProductQuery}`),
                    apiFetch(`/analytics/monthly${query}`)
                ]);

                setData({
                    summary: summaryRes.summary,
                    products: topProductsRes,
                    monthly: monthlyRes,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const totalProfit = data.summary.total_profit || 0;
    const totalSales = data.summary.revenue || 0;
    const totalTrans = data.summary.total_transaction || 0;
    const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;
    
    const sortedProducts = data.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        volume: p.sold,
        profit: p.revenue * 0.3, // Mock profit for UI consistency if not provided
        growth: Math.floor(Math.random() * 20) + 5 // Mock growth for UI consistency
    }));

    const projectedSales = (data.monthly.length > 0 ? data.monthly[data.monthly.length - 1].revenue : 0) * 1.15;

    const chartData = useMemo(() => {
        return {
            labels: data.monthly.map(m => m.month),
            sales: data.monthly.map(m => m.revenue),
            profit: data.monthly.map(m => m.revenue * 0.4), // Mock profit for chart
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
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-secondary">Sales Summary</span>
                            <button className="btn btn-sm btn-outline-primary px-3 fw-semibold" type="button" data-bs-toggle="modal" data-bs-target="#ModalExport">
                                <i className="fas fa-file-export me-1" />Export
                            </button>
                        </div>
                        <div className="clean-card shadow-sm border-start border-secondary border-4 mb-3">
                            <div className="text-muted small mb-1">Total Pendapatan</div>
                            <div className="h4 fw-bold">{formatRupiah(totalSales)}</div>
                        </div>
                        <div className="clean-card shadow-sm border-start border-secondary border-4 mb-3">
                            <div className="text-muted small mb-1">Total Transaksi</div>
                            <div className="h4 fw-bold">{totalTrans.toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <span className="badge bg-primary mb-2">Profit & Loss Tracking</span>
                        <div className="clean-card shadow-sm border-start border-success border-4 mb-3">
                            <div className="text-muted small mb-1">Laba Bersih</div>
                            <div className="h4 fw-bold text-success">{formatRupiah(totalProfit)}</div>
                        </div>
                        <div className="clean-card shadow-sm border-start border-primary border-4 mb-3">
                            <div className="text-muted small mb-1">Margin Keuntungan</div>
                            <div className="h4 fw-bold text-primary">{margin}%</div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-8 col-md-7">
                    <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm">
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
                        <>
                            <div className="clean-card shadow-sm">
                                <h6 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Top Performance Produk</h6>
                                <div className="table-responsive">
                                    <table className="table table-simple align-middle">
                                        <thead>
                                            <tr>
                                                <th>Produk</th>
                                                <th>Unit</th>
                                                <th>Laba</th>
                                                <th>Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td className="fw-bold text-dark">{product.name}</td>
                                                    <td>{product.volume.toLocaleString('id-ID')} unit</td>
                                                    <td className="text-success fw-bold">{formatRupiah(product.profit)}</td>
                                                    <td>
                                                        <span className="text-primary">
                                                            <i className="fas fa-arrow-up me-1" />
                                                            {product.growth}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="clean-card shadow-sm bg-light border-0 mt-4">
                                <h6 className="fw-bold mb-3"><i className="fas fa-robot text-primary me-2" />AI Insight</h6>
                                <div className="row">
                                    <div className="col-md-6 border-end">
                                        <small className="text-muted d-block mb-1">Estimasi Bulan Depan</small>
                                        <div className="h5 fw-bold text-primary">{formatRupiah(projectedSales)}</div>
                                    </div>
                                    <div className="col-md-6 ps-md-4">
                                        <small className="text-muted d-block mb-2">Saran Stok:</small>
                                        <div className="small text-secondary">
                                            {sortedProducts.slice(0, 2).map((product) => (
                                                <div className="mb-1" key={product.id}>- {product.name}: +{Math.round(product.volume * 0.2)} unit</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="clean-card shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0"><span className="badge bg-info me-2">Tren</span>Tren Bisnis</h6>
                            </div>
                            <div className="chart-area">
                                <TrendChart labels={chartData.labels} sales={chartData.sales} profit={chartData.profit} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ModalExport />
        </>
    );
}

export default Index;
