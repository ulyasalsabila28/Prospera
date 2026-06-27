import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
    const [isNavOpen, setIsNavOpen] = useState(false);

    // Radar Konversi (Event Tracking Skeleton)
    const trackConversion = (eventName) => {
        // Event tracking ready for production integration
    };

    return (
        <div className="landing-page bg-body-tertiary">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top landing-navbar" style={{ zIndex: 1030 }}>
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center fw-bold fs-4 text-primary" to="/">
                        <div className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                            <i className="fas fa-box" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        Prospera
                    </Link>
                    
                    {/* Hamburger Menu with A11y aria-label */}
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
                                <a className="nav-link text-primary fw-bold" href="#">Beranda</a>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link text-dark fw-bold hover-primary" to="/features">Fitur</Link>
                            </li>
                        </ul>
                        <hr className="d-lg-none my-3 text-black-50" />
                        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center gap-3 gap-lg-4 pb-3 pb-lg-0">
                            <Link to="/login" className="text-primary text-decoration-none fw-bold btn-landing-focus">
                                Masuk
                            </Link>
                            <Link to="/register" onClick={() => trackConversion('click_register_nav')} className="btn btn-primary px-4 py-2 fw-bold rounded-pill btn-landing-focus shadow-sm">
                                Daftar
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section position-relative min-vh-100 d-flex align-items-center pt-5">
                {/* SVG Topography Background is applied via CSS */}
                <div className="container position-relative z-1 mt-md-5">
                    <div className="row align-items-center gy-5">
                        <div className="col-lg-6 pe-lg-5">
                            <div className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-semibold border border-primary-subtle">
                                <i className="fas fa-bolt me-1 mb-1"></i>
                                Sistem POS B2B Terbaik
                            </div>
                            <h1 className="h1 fw-bold text-dark mb-3 lh-base" style={{ letterSpacing: '-0.5px' }}>
                                Aplikasi Kasir Pintar & <span className="text-primary">Analisis Bisnis</span> Andalan UMKM.
                            </h1>
                            <p className="mb-4 pe-md-4" style={{ color: '#4b5563', fontWeight: '500', fontSize: '1rem', lineHeight: '1.7' }}>
                                Kelola operasional toko lebih cerdas dan efisien. Dengan Prospera, nikmati pengalaman transaksi kasir anti-lag yang terintegrasi langsung dengan dasbor analitik dan sistem AI proaktif untuk mengamankan aset bisnis Anda.
                            </p>

                            <ul className="list-unstyled mb-4 text-start d-inline-block">
                                <li className="mb-2" style={{ color: '#4b5563', fontWeight: '500', fontSize: '14.5px' }}>
                                    <i className="fas fa-check-circle text-primary me-2"></i> <strong className="text-dark">Transaksi Point of Sales Andal:</strong> Responsif, mendukung berbagai fitur operasional, dan data otomatis sinkron saat online.
                                </li>
                                <li className="mb-2" style={{ color: '#4b5563', fontWeight: '500', fontSize: '14.5px' }}>
                                    <i className="fas fa-check-circle text-primary me-2"></i> <strong className="text-dark">Kecerdasan AI Terintegrasi:</strong> Dilengkapi Smart Restock, Smart Expiry, dan deteksi kecurangan di luar jam operasional.
                                </li>
                                <li className="mb-2" style={{ color: '#4b5563', fontWeight: '500', fontSize: '14.5px' }}>
                                    <i className="fas fa-check-circle text-primary me-2"></i> <strong className="text-dark">Dashboard BI Analytics:</strong> Visibilitas penuh atas performa toko dengan fitur filter data dan export laporan tingkat lanjut.
                                </li>
                            </ul>

                            <div className="d-flex flex-wrap gap-3">
                                <Link 
                                    to="/register" 
                                    onClick={() => trackConversion('click_hero_cta_primary')} 
                                    className="btn btn-primary px-4 py-2 fw-bold rounded-pill shadow-sm btn-landing-focus"
                                >
                                    Coba Gratis Sekarang
                                </Link>
                                <Link 
                                    to="/features" 
                                    onClick={() => trackConversion('click_hero_cta_secondary')}
                                    className="btn btn-outline-secondary px-4 py-2 fw-bold rounded-pill btn-landing-focus"
                                >
                                    Lihat Fitur Lengkap
                                </Link>
                            </div>
                        </div>
                        
                        <div className="col-lg-6 position-relative text-center mt-5 mt-lg-0">
                            {/* Decorative element behind image - Organic Blue Glow Halo */}
                            <div 
                                className="position-absolute top-50 start-50 translate-middle" 
                                style={{ 
                                    width: '750px', 
                                    height: '750px', 
                                    background: 'radial-gradient(circle, rgba(13, 110, 253, 0.5) 0%, rgba(13, 110, 253, 0) 65%)',
                                    zIndex: 1,
                                    filter: 'blur(60px)',
                                    pointerEvents: 'none'
                                }}
                            ></div>
                            
                            {/* The Hero Image - heavily optimized for LCP, blended with CSS mask */}
                            <img 
                                src="/hero-image-local.png" 
                                alt="Pengusaha UMKM lokal Indonesia tersenyum menggunakan aplikasi kasir cerdas Prospera" 
                                fetchPriority="high"
                                className="img-fluid hero-image-animation hero-image-blend position-relative"
                                style={{ height: '480px', width: '100%', objectFit: 'cover', objectPosition: 'top center', zIndex: 2 }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-dark text-white py-5 mt-auto" style={{ borderTop: '4px solid var(--blue-primary)' }}>
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
