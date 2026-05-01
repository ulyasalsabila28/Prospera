import { useState } from 'react';

function ModalExport() {
    const [loading, setLoading] = useState(false);

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/analytics/summary/export/${format}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Gagal mengekspor data');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Prospera_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade" id="ModalExport" tabIndex="-1" aria-labelledby="ModalExportLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold" id="ModalExportLabel">Pilih Format Export</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Tutup" />
                    </div>
                    <div className="modal-body">
                        <div className="d-grid gap-3">
                            <button 
                                type="button" 
                                className="btn btn-outline-success py-3" 
                                onClick={() => handleExport('excel')}
                                disabled={loading}
                            >
                                <i className="fas fa-file-excel me-2" />{loading ? 'Memproses...' : 'XLSX (Excel)'}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-primary py-3" 
                                onClick={() => handleExport('csv')}
                                disabled={loading}
                            >
                                <i className="fas fa-file-csv me-2" />{loading ? 'Memproses...' : 'CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalExport;
