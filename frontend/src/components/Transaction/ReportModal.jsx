import { useState, useEffect } from 'react';
import { apiFetch, formatError } from '../../utils/api';
import { formatRupiah } from '../../utils/format';

export default function ReportModal({ isOpen, onClose, onExport, onExportCsv }) {
    const [period, setPeriod] = useState('TODAY');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSummary();
        }
    }, [isOpen, period, startDate, endDate]);

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            let start = "";
            let end = "";
            const today = new Date();

            if (period === "TODAY") {
                const offset = today.getTimezoneOffset() * 60000;
                const localDate = (new Date(today - offset)).toISOString().split('T')[0];
                start = localDate;
                end = localDate;
            } else if (period === "MONTH") {
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
                start = `${year}-${month}-01`;
                end = `${year}-${month}-${lastDay}`;
            } else if (period === "CUSTOM" && startDate && endDate) {
                start = startDate;
                end = endDate;
            }

            if (period === "CUSTOM" && (!startDate || !endDate)) {
                setLoading(false);
                return; // Wait for both dates
            }

            let url = "/transactions/summary";
            let queryParams = [];
            if (start && end) {
                queryParams.push(`start=${start}`);
                queryParams.push(`end=${end}`);
            }

            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            const data = await apiFetch(url);
            setSummary(data);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleExportClick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        let start = "";
        let end = "";
        const today = new Date();

        if (period === "TODAY") {
            const offset = today.getTimezoneOffset() * 60000;
            const localDate = (new Date(today - offset)).toISOString().split('T')[0];
            start = localDate;
            end = localDate;
        } else if (period === "MONTH") {
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
            start = `${year}-${month}-01`;
            end = `${year}-${month}-${lastDay}`;
        } else if (period === "CUSTOM" && startDate && endDate) {
            start = startDate;
            end = endDate;
        }

        onExport(start, end);
    };

    const handleExportCsvClick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        let start = "";
        let end = "";
        const today = new Date();

        if (period === "TODAY") {
            const offset = today.getTimezoneOffset() * 60000;
            const localDate = (new Date(today - offset)).toISOString().split('T')[0];
            start = localDate;
            end = localDate;
        } else if (period === "MONTH") {
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
            start = `${year}-${month}-01`;
            end = `${year}-${month}-${lastDay}`;
        } else if (period === "CUSTOM" && startDate && endDate) {
            start = startDate;
            end = endDate;
        }

        onExportCsv(start, end);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <i className="fas fa-chart-line" style={{ color: '#4F46E5' }}></i> Rekap Laporan Transaksi
                    </h3>
                    <button className="modal-close" onClick={onClose} title="Tutup">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Filter Section */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Periode Laporan</label>
                        <select 
                            className="input" 
                            style={{ width: '100%', marginBottom: period === 'CUSTOM' ? '12px' : '0' }}
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="TODAY">Hari Ini</option>
                            <option value="MONTH">Bulan Ini</option>
                            <option value="ALL">Semua Waktu</option>
                            <option value="CUSTOM">Pilih Tanggal Manual...</option>
                        </select>

                        {period === "CUSTOM" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Dari:</label>
                                    <input type="date" className="input" style={{ width: "100%" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Sampai:</label>
                                    <input type="date" className="input" style={{ width: "100%" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#e5e7eb', textAlign: 'center' }}>Ringkasan Data</h4>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Memuat data...</div>
                        ) : error ? (
                            <div style={{ color: '#EF4444', textAlign: 'center', fontSize: '14px' }}>{error}</div>
                        ) : summary ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                                    <span style={{ color: '#9ca3af' }}>Total Transaksi</span>
                                    <span style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{summary.totalTransactions} TRX</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                                    <span style={{ color: '#9ca3af' }}>Omzet Penjualan</span>
                                    <span style={{ fontWeight: 'bold', color: '#10B981' }}>{formatRupiah(summary.totalIncome)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                                    <span style={{ color: '#9ca3af' }}>Pengeluaran Restock</span>
                                    <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{formatRupiah(summary.totalRestock)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                                    <span style={{ color: '#e5e7eb', fontWeight: 'bold' }}>Estimasi Laba Kotor</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: summary.totalProfit >= 0 ? '#10B981' : '#EF4444' }}>
                                        {formatRupiah(summary.totalProfit)}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button 
                            type="button"
                            onClick={handleExportClick}
                            className="button"
                            style={{ 
                                background: "rgba(16, 185, 129, 0.1)", color: "#10B981", border: "1px solid rgba(16, 185, 129, 0.2)", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                gap: "8px", padding: "12px", borderRadius: "8px", 
                                fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                                width: "100%", fontSize: "16px"
                            }}
                        >
                            <i className="fas fa-file-excel"></i> Export Laporan ke Excel
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleExportCsvClick}
                            className="button"
                            style={{ 
                                background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                gap: "8px", padding: "12px", borderRadius: "8px", 
                                fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                                width: "100%", fontSize: "16px"
                            }}
                        >
                            <i className="fas fa-file-csv"></i> Export Laporan ke CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
