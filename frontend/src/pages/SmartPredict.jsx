import { useState, useEffect } from 'react';
import { apiFetch, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';
import ErrorMessage from '../components/ErrorMessage';
import FraudDetectionWidget from '../components/FraudDetectionWidget';
import SmartExpiryWidget from '../components/SmartExpiryWidget';

function SmartPredict() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        forecast: 0,
        lowStock: [],
        allProducts: [],
        safetyStockThreshold: 30 // Nilai default sementara sebelum di-overwrite API
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // SINGLE SOURCE OF TRUTH: Jangan kirim limit dari sini. Biar Backend yang nentuin.
                const [forecastRes, lowStockRes, productsRes] = await Promise.all([
                    apiFetch('/forecast'),
                    apiFetch('/inventory/low-stock'), // <-- limit=25 dihapus
                    apiFetch('/products')
                ]);

                const forecastValue = typeof forecastRes.prediction === 'string' 
                    ? parseInt(forecastRes.prediction.replace(/[^0-9]/g, '')) 
                    : forecastRes.prediction;

                setData({
                    forecast: forecastValue,
                    lowStock: lowStockRes.data,
                    allProducts: productsRes.products || productsRes.data || productsRes,
                    // Ambil angka standar (30) dari response backend
                    safetyStockThreshold: lowStockRes.threshold || 30 
                });
            } catch (err) {
                setError(formatError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat fitur pintar...</p></div>;
    if (error) return <ErrorMessage error={error} />;

    const forecast = data.forecast;
    // Gunakan nilai threshold dari backend untuk menghitung saran restock
    const safetyStock = data.safetyStockThreshold; 

    return (
        <>
            <h3 className="fw-bold mb-4">Fitur Pintar</h3>
            <div className="row g-4">
                {/* Left Column */}
                <div className="col-lg-4 col-md-5">
                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                        <div>
                            <div className="fw-bold text-body mb-1 text-uppercase small">Sales Forecasting (Harian)</div>
                            <div className="h4 fw-bold text-success m-0">{formatRupiah(forecast)}</div>
                            <div className="text-muted small mt-1">Perkiraan pendapatan harian berikutnya.</div>
                        </div>
                        <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px', flexShrink: 0}}>
                            <i className="fas fa-chart-line fs-5"></i>
                        </div>
                    </div>

                    <FraudDetectionWidget />
                    <SmartExpiryWidget />
                </div>

                {/* Right Column */}
                <div className="col-lg-8 col-md-7 d-flex flex-column">
                    <div className="simple-card shadow-sm border border-danger border-opacity-50 mb-4 flex-grow-1 d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle me-3">
                                <i className="fas fa-exclamation-triangle" />
                            </div>
                            <h5 className="fw-bold mb-0">Peringatan Stok Barang</h5>
                        </div>
                        <div className="d-flex align-items-center flex-grow-1">
                            <div className="me-4 pe-4 border-end text-center">
                                <div className="text-muted small mb-1">Produk Kritis</div>
                                <div className="h2 fw-bold text-danger">{data.lowStock.length}</div>
                            </div>
                            <div className="flex-grow-1 small" style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "10px" }}>
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
                </div> {/* End Right Column */}

                <div className="col-12">
                    {/* Explainable AI (XAI) Banner - Human Centric */}
                    <div className="alert alert-success d-flex align-items-center mb-4 border-0 shadow-sm">
                        <i className="bi bi-check-circle-fill fs-3 me-3"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Kondisi Stok Terkendali</h6>
                            {(() => {
                                const total = data.allProducts.length;
                                const restockList = data.allProducts.filter(item => (item.suggested_restock || 0) > 0);
                                const count = restockList.length;
                                const safeCount = total - count;
                                return (
                                    <span className="small">
                                        {safeCount} dari {total} produk Anda dalam kondisi aman. Berikut adalah {count} produk yang perlu segera di-restock agar rak pajangan tidak kosong.
                                    </span>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="clean-card shadow-sm mb-4">
                        <h6 className="fw-bold mb-4"><span className="badge bg-primary me-2">Stok</span>Saran Pembelian Stok (Restock)</h6>
                        <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                            <table className="table table-simple align-middle">
                                <thead>
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th>Stok Saat Ini</th>
                                        <th>Saran Restock</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.allProducts.length > 0 ? data.allProducts : []).map((item) => {
                                        // Murni menggunakan saran dari Backend AI Restock Service
                                        const perluDipesan = item.suggested_restock || 0;
                                        
                                        if (perluDipesan <= 0) return null;
                                        
                                        return (
                                            <tr key={item.product_id}>
                                                <td className="fw-bold text-body">{item.product_name}</td>
                                                <td>{item.product_stock} unit</td>
                                                <td>
                                                    <span className="text-primary fw-bold">
                                                        +{perluDipesan} unit
                                                    </span>
                                                </td>
                                                <td className="text-muted" style={{ fontSize: "0.85rem" }}>
                                                    {item.velocity > 0 ? (
                                                        <>Barang laku keras! Rata-rata terjual <strong>{parseFloat(item.velocity).toFixed(1)} unit/hari</strong>. AI menyarankan restock <strong>{perluDipesan} unit</strong> untuk mengamankan persediaan ke depan.</>
                                                    ) : (
                                                        <>Barang ini jarang terjual (Rata-rata 0 unit/hari), namun stok saat ini (<strong>{item.product_stock} unit</strong>) berada di bawah standar pajangan rak. AI menyarankan restock hingga mencapai target display (<strong>{item.product_stock + perluDipesan} unit</strong>).</>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div> {/* End col-12 */}
            </div> {/* End row */}
        </>
    );
}

export default SmartPredict;