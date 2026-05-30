import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { clearAuthSession } from '../utils/api';

function Sidebar() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    
    // State baru untuk mengontrol muncul/hilangnya pop-up modal logout
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("userData") || localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUsername(user.username || user.name || "");
            } catch (err) {
                console.error("Error parsing user data:", err);
            }
        }
    }, []);

    const menu = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large' },
        { path: '/products', label: 'Produk', icon: 'fas fa-box' },
        { path: '/transaction', label: 'Transaksi', icon: 'fas fa-shopping-cart' },
        { path: '/bi-analytics', label: 'Analitik Bisnis', icon: 'fas fa-chart-bar' },
        { path: '/smart-predict', label: 'Fitur Pintar', icon: 'fas fa-robot' },
    ];

    // Fungsi ini dieksekusi HANYA jika tombol "Ya, Keluar" di dalam modal ditekan
    const confirmLogout = () => {
        clearAuthSession();
        navigate('/login');
    };

    return (
        <>
            <aside className="sidebar d-flex flex-column justify-content-between pb-4">
                <div>
                    <div className="logo px-2">
                        <i className="fas fa-layer-group"/><span>Prospera</span>
                    </div>

                    {username && (
                        <div className="px-3 mb-4 text-center">
                            <small className="d-block text-white-50">Selamat datang,</small>
                            <div className="fw-bold text-white h6 mb-0">Hi, {username}!</div>
                        </div>
                    )}

                    <ul className="nav flex-column">
                        {menu.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <NavLink 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <i className={item.icon} />
                                    <span className="nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="px-3">
                    {/* Saat tombol ini ditekan, modal akan muncul (state jadi true) */}
                    <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="nav-link w-100 border-0 bg-transparent text-start"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-sign-out-alt" />
                        <span className="nav-text">Keluar</span>
                    </button>
                </div>
            </aside>

            {/* --- MODAL KONFIRMASI LOGOUT --- */}
            {showLogoutModal && (
                <div 
                    className="modal d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} // Efek background gelap
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0 pb-0">
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowLogoutModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <i className="fas fa-sign-out-alt fa-3x text-danger mb-3"></i>
                                <p className="mb-0 text-secondary" style={{ fontSize: '1.1rem' }}>
                                    Apakah Anda yakin ingin keluar dari Prospera?
                                </p>
                            </div>
                            <div className="modal-footer border-0 justify-content-center pt-0 pb-4">
                                {/* Tombol Batal mengembalikan state jadi false */}
                                <button 
                                    type="button" 
                                    className="btn btn-light px-4 py-2 me-2" 
                                    onClick={() => setShowLogoutModal(false)}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    Batal
                                </button>
                                {/* Tombol Keluar mengeksekusi fungsi hapus sesi */}
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-4 py-2" 
                                    onClick={confirmLogout}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    Ya, Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;