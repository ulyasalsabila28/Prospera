import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { formatRupiah } from '../utils/format';

function SmartPredict() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        forecast: 0,
        lowStock: [],
        allProducts: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [forecastRes, lowStockRes, productsRes] = await Promise.all([
                    apiFetch('/forecast'),
                    apiFetch('/inventory/low-stock?limit=25'),
                    apiFetch('/products')
                ]);

                // Parse "Rp 123.000" string to number if needed, or use as is
                const forecastValue = typeof forecastRes.prediction === 'string' 
                    ? parseInt(forecastRes.prediction.replace(/[^0-9]/g, '')) 
                    : forecastRes.prediction;

                setData({
                    forecast: forecastValue,
                    lowStock: lowStockRes.data,
                    allProducts: productsRes.data || productsRes // Handle different response formats
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat fitur pintar...</p></div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}. Pastikan Anda sudah login dan server backend berjalan.</div>;

    const safetyStock = 25;
    const forecast = data.forecast;

    return (
        <>
            <h3 className="fw-bold mb-4">Fitur Pintar</h3>
            <div className="row g-4 align-items-start">
                <div className="col-md-5">
                    <div className="simple-card shadow-sm d-flex flex-column justify-content-center" style={{ minHeight: '180px' }}>
                        <div className="text-muted small text-uppercase fw-bold mb-2">Sales Forecasting (Harian)</div>
                        <div className="h2 fw-bold mb-2">{formatRupiah(forecast)}</div>
                        <div className="small text-secondary">Perkiraan pendapatan rata-rata harian berikutnya.</div>
                    </div>
                </div>
                <div className="col-md-7">
                    <div className="simple-card shadow-sm border-start border-danger border-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle me-3">
                                <i className="fas fa-exclamation-triangle" />
                            </div>
                            <h5 className="fw-bold mb-0">Peringatan Stok Barang</h5>
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="me-4 pe-4 border-end text-center">
                                <div className="text-muted small mb-1">Produk Kritis</div>
                                <div className="h2 fw-bold text-danger">{data.lowStock.length}</div>
                            </div>
                            <div className="flex-grow-1 small">
                                {data.lowStock.length > 0 ? (
                                    data.lowStock.map((item) => (
                                        <div className="alert-item d-flex justify-content-between align-items-center mb-1" key={item.product_id}>
                                            <span>{item.product_name}</span>
                                            <span className="text-danger fw-bold">{item.product_stock} unit</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted">Semua stok produk saat ini dalam kondisi aman.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    <div className="simple-card shadow-sm">
                        <h5 className="fw-bold mb-4">Saran Pembelian Stok (Restock)</h5>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle">
                                <thead className="text-muted">
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th>Stok Saat Ini</th>
                                        <th>Saran Restock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.allProducts.length > 0 ? data.allProducts : []).map((item) => {
                                        const needsRestock = item.product_stock < safetyStock;
                                        const perluDipesan = needsRestock ? safetyStock * 2 - item.product_stock : 0;
                                        if (perluDipesan === 0) return null;
                                        return (
                                            <tr key={item.product_id}>
                                                <td><div className="fw-bold">{item.product_name}</div></td>
                                                <td>{item.product_stock} unit</td>
                                                <td><span className="badge bg-primary">+{perluDipesan} unit</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SmartPredict;
