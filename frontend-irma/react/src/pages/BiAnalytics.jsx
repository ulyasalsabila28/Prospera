import { useState, useEffect, useMemo } from 'react';
import TrendChart from '../components/TrendChart';
import { apiFetch } from '../utils/api';
import { formatRupiah } from '../utils/format';

function BiAnalytics() {
    const [view, setView] = useState('list');
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
                // Menambahkan pengecekan agar parameter hanya dikirim jika ada isinya
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);

                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=5` : '?limit=5';

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

    const ringkasan = {
        penjualan: data.summary.revenue || 0,
        laba: data.summary.total_profit || 0,
        transaksi: data.summary.total_transaction || 0
    };

    const margin = ringkasan.penjualan > 0 ? ((ringkasan.laba / ringkasan.penjualan) * 100).toFixed(1) : 0;

    const trend = useMemo(() => {
        // Jika data monthly kosong, tampilkan label kosong agar grafik tidak error
        if (!data.monthly || data.monthly.length === 0) {
            return { labels: [], data: [], laba: [] };
        }

        return {
            labels: data.monthly.map(m => {
                // Mengubah format "2026-04" menjadi lebih cantik jika memungkinkan
                const [year, month] = m.month.split('-');
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                return `${monthNames[parseInt(month)-1]} ${year}`;
            }),
            data: data.monthly.map(m => m.revenue),
            laba: data.monthly.map(m => m.revenue * 0.4) // Simulasi laba 40%
        };
    }, [data.monthly]);

    const performa = data.products.map(p => ({
        nama: p.product_name,
        volume: p.sold,
        laba: p.revenue * 0.3 // Mock profit
    }));

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat data BI...</p></div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}. Pastikan Anda sudah login dan server backend berjalan.</div>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Analitik Bisnis (BI)</h3>
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
                        <span className="badge bg-secondary mb-2">Sales Summary</span>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Total Pendapatan</small>
                            <div className="h4 fw-bold">{formatRupiah(ringkasan.penjualan)}</div>
                        </div>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Jumlah Transaksi</small>
                            <div className="h4 fw-bold">{ringkasan.transaksi.toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <span className="badge bg-primary mb-2">Profit & Loss Tracking</span>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Laba Bersih (P&L)</small>
                            <div className="h4 fw-bold text-success">{formatRupiah(ringkasan.laba)}</div>
                        </div>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Margin Keuntungan</small>
                            <div className="h4 fw-bold text-primary">{margin}%</div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-8 col-md-7">
                    <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm">
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'list' ? 'active' : ''}`} type="button" onClick={() => setView('list')}>
                                <i className="fas fa-boxes me-2" />Daftar Barang Penjualan
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'chart' ? 'active' : ''}`} type="button" onClick={() => setView('chart')}>
                                <i className="fas fa-chart-area me-2" />Analisis Tren
                            </button>
                        </li>
                    </ul>

                    {view === 'list' ? (
                        <div className="card border-0 shadow-sm p-4">
                                <h5 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Performa Penjualan Barang</h5>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle">
                                    <thead className="bg-light">
                                        <tr className="small text-muted text-uppercase">
                                            <th>Nama Barang</th>
                                            <th className="text-center">Volume</th>
                                            <th className="text-end">Kontribusi Laba</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performa.map((item) => (
                                            <tr key={item.nama}>
                                                <td><div className="fw-bold">{item.nama}</div></td>
                                                <td className="text-center">{item.volume.toLocaleString('id-ID')} unit</td>
                                                <td className="text-end text-success fw-bold">{formatRupiah(item.laba)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm p-4">
                            <div className="d-flex justify-content-between mb-4">
                                <h5 className="fw-bold"><span className="badge bg-info me-2">Tren</span>Tren Penjualan & Laba</h5>
                            </div>
                            <div className="chart-container">
                                <TrendChart labels={trend.labels} sales={trend.data} profit={trend.laba} salesLabel="Penjualan" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default BiAnalytics;
