import React, { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings, formatError, getCurrentUser } from '../utils/api';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../contexts/ToastContext';

export default function StoreSettings() {
    const [settings, setSettings] = useState({
        open_hour: '08:00:00',
        close_hour: '22:00:00',
        grace_period_minutes: 30,
        emergency_pin: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    const user = getCurrentUser();

    useEffect(() => {
        if (user && user.role !== 'owner') {
            setError("Anda tidak memiliki hak akses untuk halaman ini.");
            setLoading(false);
            return;
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getStoreSettings();
            if (data) {
                setSettings({
                    open_hour: data.open_hour || '08:00:00',
                    close_hour: data.close_hour || '22:00:00',
                    grace_period_minutes: data.grace_period_minutes || 30,
                    emergency_pin: '' // sengaja dikosongkan untuk keamanan
                });
            }
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...settings };
            if (!payload.emergency_pin) {
                delete payload.emergency_pin; // Jangan update jika kosong
            }
            await updateStoreSettings(payload);
            showToast("Pengaturan toko berhasil diperbarui!", 'success');
            setSettings(prev => ({ ...prev, emergency_pin: '' })); // Kosongkan kembali PIN
        } catch (err) {
            showToast(formatError(err), 'danger');
        } finally {
            setSaving(false);
        }
    };

    if (error) {
        return <div className="card"><div className="card-body"><ErrorMessage error={error} /></div></div>;
    }

    if (loading) {
        return <div className="card"><div className="card-body">Memuat pengaturan...</div></div>;
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
                <h4 className="fw-bold mb-4"><i className="fas fa-store me-2 text-primary"></i>Pengaturan Toko</h4>

                <form onSubmit={handleSubmit}>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <h5 className="fw-bold mb-3"><i className="fas fa-clock me-2 text-warning"></i>Jam Operasional</h5>
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">Jam Buka</label>
                                <input type="time" step="1" className="form-control" name="open_hour" value={settings.open_hour} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">Jam Tutup</label>
                                <input type="time" step="1" className="form-control" name="close_hour" value={settings.close_hour} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">Toleransi Waktu (Menit)</label>
                                <input type="number" className="form-control" name="grace_period_minutes" value={settings.grace_period_minutes} onChange={handleChange} min="0" required />
                                <div className="form-text">Batas waktu tambahan untuk kasir menyelesaikan transaksi setelah toko tutup.</div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <h5 className="fw-bold mb-3"><i className="fas fa-shield-alt me-2 text-danger"></i>Keamanan</h5>
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">PIN Darurat (Emergency PIN)</label>
                                <input type="password" placeholder="Kosongkan jika tidak ingin mengubah" className="form-control" name="emergency_pin" value={settings.emergency_pin} onChange={handleChange} />
                                <div className="form-text">PIN ini digunakan oleh kasir untuk transaksi di luar jam operasional (wajib diisi oleh kasir saat konfirmasi).</div>
                            </div>
                        </div>
                    </div>

                    <div className="text-end border-top pt-3">
                        <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={saving}>
                            {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Menyimpan...</> : <><i className="fas fa-save me-2"></i>Simpan Pengaturan</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
