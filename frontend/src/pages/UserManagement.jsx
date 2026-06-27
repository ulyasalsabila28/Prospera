import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch, formatError } from "../utils/api";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../contexts/ConfirmContext";

// Regex standar industri — selaras dengan backend
import { EMAIL_REGEX } from "../utils/validators";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state Edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");

    // Form state Reset Password
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPasswordValue, setResetPasswordValue] = useState("");
    const [confirmResetPasswordValue, setConfirmResetPasswordValue] = useState("");
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/auth/users");
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(formatError(err), 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreateUser = async () => {
        // Validasi client-side
        if (!username.trim()) {
            showToast("Username wajib diisi.", 'warning');
            return;
        }
        if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
            showToast("Masukkan email dengan format yang valid.", 'warning');
            return;
        }
        if (!password || password.length < 6) {
            showToast("Password minimal 6 karakter.", 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiFetch("/auth/users", {
                method: "POST",
                body: JSON.stringify({
                    username: username.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role: "karyawan"
                })
            });
            showToast(data.message || "Akun Karyawan berhasil dibuat.", 'success');
            setUsername("");
            setEmail("");
            setPassword("");
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            showToast(formatError(err), 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const data = await apiFetch(`/auth/users/${userId}`, { method: "DELETE" });
            showToast(data.message || "Akun berhasil dihapus.", 'success');
            fetchUsers();
        } catch (err) {
            showToast(formatError(err), 'danger');
        }
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditEmail(user.email);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editUsername.trim() || !editEmail.trim() || !EMAIL_REGEX.test(editEmail.trim())) {
            showToast("Data tidak valid. Periksa kembali input Anda.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiFetch(`/auth/users/${editingUser.user_id}`, {
                method: "PUT",
                body: JSON.stringify({
                    username: editUsername.trim(),
                    email: editEmail.trim().toLowerCase()
                })
            });
            showToast(data.message || "Akun berhasil diperbarui.", "success");
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            showToast(formatError(err), "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReset = (user) => {
        setEditingUser(user);
        setResetPasswordValue("");
        setConfirmResetPasswordValue("");
        setShowResetPassword(false);
        setShowConfirmResetPassword(false);
        setShowResetModal(true);
    };

    const handleSaveResetPassword = async () => {
        if (!resetPasswordValue || resetPasswordValue.length < 6) {
            showToast("Password minimal 6 karakter.", "warning");
            return;
        }
        if (resetPasswordValue !== confirmResetPasswordValue) {
            showToast("Konfirmasi password tidak sesuai.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiFetch(`/auth/users/${editingUser.user_id}/reset-password`, {
                method: "PUT",
                body: JSON.stringify({ password: resetPasswordValue })
            });
            showToast(data.message || "Password berhasil direset.", "success");
            setShowResetModal(false);
        } catch (err) {
            showToast(formatError(err), "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">
                    <i className="fas fa-users-cog me-2"></i>Kelola Pengguna
                </h3>
                <button 
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    style={{ borderRadius: '10px' }}
                    onClick={() => setShowForm(!showForm)}
                >
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-user-plus'} me-2`}></i>
                    {showForm ? 'Batal' : 'Tambah Karyawan'}
                </button>
            </div>

            {/* Form Tambah Karyawan */}
            {showForm && (
                <div className="clean-card shadow-sm mb-4" style={{ border: '2px solid #3B82F6' }}>
                    <h6 className="fw-bold mb-3">
                        <span className="badge bg-primary me-2">Baru</span>Buat Akun Karyawan
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Username</label>
                            <input className="form-control" placeholder="Nama karyawan" value={username}
                                onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Email</label>
                            <input className="form-control" placeholder="email@contoh.com" type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Password</label>
                            <input className="form-control" placeholder="Min. 6 karakter" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-3 text-end">
                        <button 
                            className="btn btn-primary px-4 py-2 fw-semibold" 
                            onClick={handleCreateUser}
                            disabled={isSubmitting}
                            style={{ borderRadius: '8px', opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</>
                            ) : (
                                <><i className="fas fa-save me-2"></i>Simpan Akun</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabel Daftar User */}
            <div className="clean-card shadow-sm">
                <h6 className="fw-bold mb-3">
                    <span className="badge bg-secondary me-2">{users.length}</span>Daftar Pengguna Terdaftar
                </h6>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                        <p className="mt-2 text-muted">Memuat data...</p>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-muted text-center py-4">Belum ada user terdaftar.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-simple align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.user_id}>
                                        <td className="text-muted">{index + 1}</td>
                                        <td className="fw-bold">{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'owner' ? 'bg-warning text-body' : 'bg-info text-white'}`}
                                                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>
                                                {user.role === 'owner' ? '👑 Owner' : '🧾 Karyawan'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.is_active === false ? (
                                                <span className="badge bg-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>Nonaktif</span>
                                            ) : (
                                                <span className="badge bg-success" style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>Aktif</span>
                                            )}
                                        </td>
                                        <td>
                                            {user.role === 'karyawan' ? (
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-outline-warning btn-sm px-3"
                                                        style={{ borderRadius: '8px' }}
                                                        onClick={() => handleOpenEdit(user)}
                                                        disabled={!user.is_active}
                                                    >
                                                        <i className="fas fa-edit me-1"></i>Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-info btn-sm px-3"
                                                        style={{ borderRadius: '8px' }}
                                                        onClick={() => handleOpenReset(user)}
                                                        disabled={!user.is_active}
                                                    >
                                                        <i className="fas fa-key me-1"></i>Reset Password
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm px-3"
                                                        style={{ borderRadius: '8px' }}
                                                        onClick={() => {
                                                            showConfirm({
                                                                title: 'Nonaktifkan Akun Karyawan?',
                                                                message: `Anda akan menonaktifkan akun "${user.username}" (${user.email}).`,
                                                                isDanger: true,
                                                                confirmText: 'Ya, Nonaktifkan',
                                                                onConfirm: () => handleDeleteUser(user.user_id)
                                                            });
                                                        }}
                                                        disabled={!user.is_active}
                                                    >
                                                        <i className="fas fa-trash-alt me-1"></i>Nonaktifkan
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted small">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Edit Karyawan */}
            {showEditModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold">Edit Karyawan</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold">Username</label>
                                        <input 
                                            className="form-control" 
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold">Email</label>
                                        <input 
                                            className="form-control" 
                                            type="email" 
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pt-0">
                                    <button className="btn btn-light" onClick={() => setShowEditModal(false)}>Batal</button>
                                    <button 
                                        className="btn btn-primary px-4" 
                                        onClick={handleSaveEdit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Reset Password */}
            {showResetModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold">Reset Password</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowResetModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small mb-3">
                                        Masukkan password baru untuk akun <strong>{editingUser?.username}</strong>.
                                    </p>
                                    <div className="mb-3 position-relative">
                                        <label className="form-label text-muted small fw-bold">Password Baru</label>
                                        <div className="input-group">
                                            <input 
                                                className="form-control" 
                                                type={showResetPassword ? "text" : "password"}
                                                placeholder="Minimal 6 karakter"
                                                value={resetPasswordValue}
                                                onChange={(e) => setResetPasswordValue(e.target.value)}
                                                style={{ borderRight: 'none' }}
                                            />
                                            <button 
                                                className="btn btn-outline-secondary bg-white border-start-0" 
                                                type="button"
                                                style={{ borderColor: '#dee2e6' }}
                                                onClick={() => setShowResetPassword(!showResetPassword)}
                                            >
                                                {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-3 position-relative">
                                        <label className="form-label text-muted small fw-bold">Konfirmasi Password Baru</label>
                                        <div className="input-group">
                                            <input 
                                                className="form-control" 
                                                type={showConfirmResetPassword ? "text" : "password"}
                                                placeholder="Ulangi password baru"
                                                value={confirmResetPasswordValue}
                                                onChange={(e) => setConfirmResetPasswordValue(e.target.value)}
                                                style={{ borderRight: 'none' }}
                                            />
                                            <button 
                                                className="btn btn-outline-secondary bg-white border-start-0" 
                                                type="button"
                                                style={{ borderColor: '#dee2e6' }}
                                                onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                                            >
                                                {showConfirmResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pt-0">
                                    <button className="btn btn-light" onClick={() => setShowResetModal(false)}>Batal</button>
                                    <button 
                                        className="btn btn-primary px-4" 
                                        onClick={handleSaveResetPassword}
                                        disabled={isSubmitting || resetPasswordValue.length < 6 || resetPasswordValue !== confirmResetPasswordValue}
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
