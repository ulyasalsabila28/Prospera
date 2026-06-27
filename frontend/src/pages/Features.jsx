import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Features() {
    const [activeTab, setActiveTab] = useState(0);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // Ensure page starts from top when navigated to
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Radar Konversi (Event Tracking Skeleton)
    const trackConversion = (eventName) => {
        // Event tracking ready for production integration
    };

    const featuresData = [
        {
            title: "Dashboard & Analitik Bisnis",
            icon: "fas fa-chart-line",
            items: [
                "Dashboard terpusat untuk memantau performa toko secara real-time.",
                "Analitik cerdas: grafik tren penjualan, produk terlaris, dan metrik bisnis.",
                "Laporan laba-rugi kotor otomatis tanpa perlu rekap manual.",
                "Filter data historis secara cepat untuk keputusan strategis."
            ]
        },
        {
            title: "Transaksi & Kasir (POS)",
            icon: "fas fa-cash-register",
            items: [
                "Transaksi super cepat dan responsif dengan pengalaman pengguna yang mulus.",
                "Mode Offline-Ready: Kasir tetap bisa berjualan walau internet mati (sinkronisasi otomatis saat online).",
                "Fitur filter data dan rekap laporan transaksi tingkat lanjut.",
                "Dilengkapi kemampuan Export ke Excel berdasarkan rentang waktu spesifik."
            ]
        },
        {
            title: "Kecerdasan Buatan (AI Smart Predict)",
            icon: "fas fa-brain",
            items: [
                "Smart Restock: Memberikan saran restock dan peringatan stok habis berdasarkan data historis.",
                "Fraud Detection: Mendeteksi data anomali dan transaksi mencurigakan yang dilakukan di luar jam operasional.",
                "Smart Expiry: Memberikan peringatan untuk produk yang mendekati masa kedaluwarsa (mendukung fitur markdown / penurunan harga diskon), serta manajemen pemusnahan stok untuk produk yang sudah expired."
            ]
        },
        {
            title: "Manajemen Produk & Inventaris",
            icon: "fas fa-box-open",
            items: [
                "Tambah, edit, dan hapus ribuan SKU (produk) tanpa lag.",
                "Kategorisasi produk yang rapi untuk pencarian barang secepat kilat saat kasir bertugas.",
                "Pemantauan sisa stok secara presisi dan terpusat.",
                "Pengaturan harga dasar dan harga jual dengan sistem yang intuitif."
            ]
        },
        {
            title: "Manajemen Pengguna & Hak Akses",
            icon: "fas fa-users-cog",
            items: [
                "Mendukung sistem 2 Peran Inti: Owner (Pemilik) dan Karyawan.",
                "Owner memegang kendali penuh untuk membuat dan menambah akun karyawan baru.",
                "Karyawan memiliki akses operasional terbatas sesuai kebijakan keamanan toko."
            ]
        },
        {
            title: "Pengaturan Toko & Keamanan Jam Operasional",
            icon: "fas fa-store",
            items: [
                "Owner dapat mengatur jam buka-tutup toko secara spesifik.",
                "Karyawan dilarang melakukan input transaksi di luar jam tersebut kecuali memiliki PIN Keamanan otorisasi.",
                "Fitur Toleransi Waktu: Mesin kasir dapat dikonfigurasi untuk tetap beroperasi beberapa menit sebelum buka dan sesudah tutup (contoh: 60 menit).",
                "Pengelolaan PIN Keamanan terpusat di halaman ini."
            ]
        }
    ];

    return (
        <div className="landing-page hero-section position-relative">
            {/* Background dengan sentuhan Aura Biru Enterprise di tengah */}
            <div className="position-absolute w-100 h-100" style={{ 
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at center, rgba(13, 110, 253, 0.06) 0%, transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top landing-navbar" style={{ zIndex: 1030 }}>
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center fw-bold fs-4 text-primary" to="/">
                        <div className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                            <i className="fas fa-box" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        Prospera
                    </Link>
                    
                    <button 
                        className={`navbar-toggler ${isNavOpen ? '' : 'collapsed'}`}
                        type="button" 
                        onClick={() => setIsNavOpen(!isNavOpen)}
                        aria-controls="landingNavbar" 
                        aria-expanded={isNavOpen} 
                        aria-label="Toggle navigation"
                    >
                        <i className="fas fa-bars fs-4 text-dark"></i>
                    </button>
                    
                    <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="landingNavbar">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-2 gap-lg-3 mt-3 mt-lg-0 text-center text-lg-start">
                            <li className="nav-item">
                                <Link className="nav-link text-dark fw-bold hover-primary" to="/">Beranda</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link text-primary fw-bold" to="/features">Fitur</Link>
                            </li>
                        </ul>
                        <hr className="d-lg-none my-3 text-black-50" />
                        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center gap-3 gap-lg-4 pb-3 pb-lg-0">
                            <Link to="/login" className="text-dark text-decoration-none fw-bold btn-landing-focus hover-primary">
                                Masuk
                            </Link>
                            <Link to="/register" onClick={() => trackConversion('click_register_nav')} className="btn btn-primary px-4 py-2 fw-bold rounded-pill btn-landing-focus shadow-sm">
                                Daftar
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <section className="py-5 flex-grow-1 position-relative" style={{ marginTop: '76px', zIndex: 1 }}>
                <div className="container pt-4 pb-5" style={{ maxWidth: '1050px' }}>
                    <div className="text-center mb-5">
                        <h1 className="fw-bold text-dark mb-3">Fitur - Fitur Prospera POS</h1>
                        <p className="lead text-secondary mx-auto" style={{ maxWidth: '700px' }}>
                            Eksplorasi seluruh kecanggihan sistem kasir cerdas kelas Enterprise kami yang dirancang khusus untuk membuat UMKM Anda naik kelas.
                        </p>
                    </div>

                    <div className="row g-4 align-items-stretch">
                        {/* Kolom Kiri: Vertical Tabs Navigasi */}
                        <div className="col-lg-4 pe-lg-4">
                            <div className="d-flex flex-column sticky-lg-top" style={{ top: '100px' }}>
                                {featuresData.map((feature, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveTab(index)}
                                        className={`btn text-start py-2 px-3 border-0 transition-all d-flex align-items-center gap-3 mb-1 ${
                                            activeTab === index 
                                            ? 'bg-primary text-white rounded-3 fw-bold' 
                                            : 'bg-transparent text-secondary hover-primary'
                                        }`}
                                    >
                                        <div className="d-flex align-items-center justify-content-center" style={{ width: '24px' }}>
                                            <i className={`${feature.icon} ${activeTab === index ? 'text-white' : 'text-primary'}`} style={{ fontSize: '1rem' }}></i>
                                        </div>
                                        <span style={{ fontSize: '15px', fontWeight: activeTab === index ? '700' : '600' }}>{feature.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kolom Kanan: Konten Fitur */}
                        <div className="col-lg-8">
                            <div className="card h-100 bg-white" style={{ border: '1px solid rgba(13, 110, 253, 0.1)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div className="card-body p-4 p-lg-5">
                                    <h5 className="fw-bold mb-4 text-dark" style={{ fontSize: '1.15rem' }}>{featuresData[activeTab].title}</h5>
                                    
                                    <ul style={{ paddingLeft: '20px' }}>
                                        {featuresData[activeTab].items.map((item, i) => (
                                            <li key={i} className="mb-3 text-secondary" style={{ lineHeight: '1.7', fontSize: '14.5px', fontWeight: '500' }}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-dark text-white py-5 mt-auto position-relative" style={{ zIndex: 1, borderTop: '4px solid var(--blue-primary)' }}>
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-12 col-md-6 text-center text-md-start">
                            <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                                <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px' }}>
                                    <i className="fas fa-box" style={{ fontSize: '1rem' }}></i>
                                </div>
                                <h5 className="fw-bold mb-0">Prospera</h5>
                            </div>
                            <p className="text-white-50 small mb-0 mx-auto mx-md-0" style={{ maxWidth: '380px', lineHeight: '1.6' }}>
                                Solusi Kasir Pintar B2B & Analitik Bisnis yang dirancang khusus untuk mengoptimalkan operasional dan membawa UMKM Indonesia naik kelas.
                            </p>
                        </div>
                        <div className="col-12 col-md-6 text-center text-md-end d-flex flex-column justify-content-md-end">
                            <div className="mb-3">
                                <a href="#" className="text-white-50 text-decoration-none small me-4 hover-primary btn-landing-focus transition-all">Syarat & Ketentuan</a>
                                <a href="#" className="text-white-50 text-decoration-none small hover-primary btn-landing-focus transition-all">Kebijakan Privasi</a>
                            </div>
                            <p className="mb-0 text-white-50 small opacity-75">&copy; 2026 Prospera. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
