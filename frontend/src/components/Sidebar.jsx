/**
 * Sidebar.jsx — Navigasi Samping Aplikasi
 * REFACTOR (F-T03): Modal Logout & Change Password dipecah ke komponen terpisah.
 * Sidebar kini hanya fokus pada navigasi dan rendering menu.
 * 
 * Sebelum: 272 baris (termasuk 2 modal inline + state + handler)
 * Sesudah: ~80 baris (navigasi murni)
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiFetch, clearAuthSession, getCurrentUser } from '../utils/api';
import LogoutModal from './LogoutModal';
import ChangePasswordModal from './ChangePasswordModal';
import { useTheme } from '../hooks/useTheme';

function Sidebar() {
    const navigate = useNavigate();
    const { theme, changeTheme } = useTheme();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        // FIX (CRITICAL-FE-01): Gunakan getCurrentUser() dari api.js
        // yang membaca dari sessionStorage secara konsisten (selaras dengan setAuthSession).
        const user = getCurrentUser();
        if (user) {
            setUsername(user.username || user.name || "");
            setRole(user.role || null);
        }
    }, []);

    // Menu dinamis berdasarkan role
    const allMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large', roles: ['owner'] },
        { path: '/products', label: 'Produk', icon: 'fas fa-box', roles: ['owner', 'karyawan'] },
        { path: '/categories', label: 'Kategori', icon: 'fas fa-tags', roles: ['owner', 'karyawan'] },
        { path: '/transaction', label: 'Transaksi', icon: 'fas fa-shopping-cart', roles: ['owner', 'karyawan'] },
        { path: '/bi-analytics', label: 'Analitik Bisnis', icon: 'fas fa-chart-bar', roles: ['owner'] },
        { path: '/smart-predict', label: 'Fitur Pintar', icon: 'fas fa-robot', roles: ['owner'] },
        { path: '/user-management', label: 'Kelola User', icon: 'fas fa-users-cog', roles: ['owner'] },
        { path: '/settings', label: 'Pengaturan Toko', icon: 'fas fa-store', roles: ['owner'] },
    ];

    const menu = allMenu.filter(item => !role || item.roles.includes(role));

    const confirmLogout = async () => {
        try {
            // FIX (V4.0): Panggil API Backend untuk membersihkan HttpOnly Cookie
            // dan mencatat token JTI ke BlacklistedTokens
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error("Gagal logout di server:", e);
        } finally {
            clearAuthSession();
            navigate('/');
        }
    };

    const replayTour = () => {
        if (window.location.pathname !== '/dashboard') {
            navigate('/dashboard');
        } else {
            window.dispatchEvent(new Event('replayTour'));
        }
    };

    const cycleTheme = () => {
        if (theme === 'light') changeTheme('dark');
        else if (theme === 'dark') changeTheme('system');
        else changeTheme('light');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return 'fas fa-sun text-warning';
        if (theme === 'dark') return 'fas fa-moon text-primary';
        return 'fas fa-desktop text-secondary';
    };

    const getThemeText = () => {
        if (theme === 'light') return 'Tema: Terang';
        if (theme === 'dark') return 'Tema: Gelap';
        return 'Tema: Sistem';
    };

    return (
        <>
            <aside className="sidebar d-flex flex-column justify-content-between pb-4">
                <div>
                    <div className="logo px-2">
                        <i className="fas fa-layer-group"/><span>Prospera</span>
                    </div>

                    {username && (
                        <div className="px-3 mb-4 text-center sidebar-user-info">
                            <small className="d-block text-white-50">Selamat datang,</small>
                            <div className="fw-bold text-white h6 mb-0">Hi, {username}!</div>
                            {role && (
                                <span className="badge mt-1" style={{ 
                                    background: role === 'owner' ? 'rgba(234,179,8,0.2)' : 'rgba(96,165,250,0.2)', 
                                    color: role === 'owner' ? '#FCD34D' : '#93C5FD',
                                    fontSize: '10px',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {role === 'owner' ? '👑 Owner' : '🧾 Karyawan'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-grow-1 overflow-auto hide-scrollbar custom-scrollbar" style={{ minHeight: 0, marginRight: "-12px", paddingRight: "12px" }}>
                    <ul className="nav flex-column">
                        {menu.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <NavLink 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    data-tour={item.path === '/products' ? 'tour-products' : item.path === '/transaction' ? 'tour-transactions' : null}
                                >
                                    <i className={item.icon} />
                                    <span className="nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="px-3 mt-auto pt-3 border-top">
                    <button 
                        onClick={cycleTheme}
                        className="nav-link w-100 border-0 bg-transparent text-start mb-2"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className={getThemeIcon()} />
                        <span className="nav-text">{getThemeText()}</span>
                    </button>
                    <button 
                        onClick={replayTour}
                        className="nav-link w-100 border-0 bg-transparent text-start mb-2"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-play-circle" />
                        <span className="nav-text">Ulangi Panduan</span>
                    </button>
                    <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="nav-link w-100 border-0 bg-transparent text-start mb-2"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-key" />
                        <span className="nav-text">Ganti Password</span>
                    </button>
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

            {/* Modal diekstrak ke komponen terpisah (F-T03) */}
            <LogoutModal 
                show={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={confirmLogout} 
            />
            <ChangePasswordModal 
                show={showPasswordModal} 
                onClose={() => setShowPasswordModal(false)} 
            />
        </>
    );
}

export default Sidebar;
