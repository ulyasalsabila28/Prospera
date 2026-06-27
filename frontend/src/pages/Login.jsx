import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { apiFetch, setAuthSession, getCurrentUser, formatError } from "../utils/api";
import heroImg1 from "../assets/kasair_local_boutique.png";
import heroImg2 from "../assets/prospera_slide_2.png";
import heroImg3 from "../assets/prospera_slide_3.png";
import heroImg4 from "../assets/prospera_slide_4.png";

const slides = [heroImg1, heroImg2, heroImg3, heroImg4];

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi.").max(64, "Password maksimal 64 karakter.")
});

export default function Login() {
  const [activeTab, setActiveTab] = useState("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(() => {
    return parseInt(sessionStorage.getItem("authSlideIndex") || "0", 10);
  });
  const nav = useNavigate();

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slides.length;
        sessionStorage.setItem("authSlideIndex", nextSlide);
        return nextSlide;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role) {
      if (user.role === 'karyawan') nav("/transaction", { replace: true });
      else nav("/dashboard", { replace: true });
    }
  }, [nav]);

  const onSubmit = async (data) => {
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (response.user.role !== activeTab) {
        const tabLabel = activeTab === 'owner' ? 'Owner' : 'Karyawan';
        const roleLabel = response.user.role === 'owner' ? 'Owner' : 'Karyawan';
        setError("root", { message: `Email terdaftar sebagai ${roleLabel}, bukan ${tabLabel}. Silakan pindah tab.` });
        return;
      }

      setAuthSession(null, response.user);

      if (response.user.role === 'karyawan') nav("/transaction");
      else nav("/dashboard");
    } catch (err) {
      const msg = err.message || formatError(err);
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("sandi") || msg.toLowerCase().includes("sesi") || msg.toLowerCase().includes("autentikasi")) {
        setError("email", { message: msg });
        setError("password", { message: msg });
      } else {
        setError("root", { message: msg });
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE - IMAGE */}
        <div className="login-left">
          {slides.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt="Prospera Kasir POS UMKM" 
              style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: "100%",
                objectFit: "cover",
                opacity: idx === currentSlide ? 1 : 0,
                transition: "opacity 1s ease-in-out"
              }} 
            />
          ))}
          <div className="login-left-overlay">
            <div className="d-flex justify-content-between align-items-start">
              <div className="login-left-logo">PROSPERA</div>
              <div className="d-flex mt-2" style={{ gap: "6px" }}>
                {slides.map((_, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      width: idx === currentSlide ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      opacity: idx === currentSlide ? 1 : 0.5,
                      transition: "all 0.3s ease"
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="login-left-caption">
              Kelola operasional toko lebih cerdas dan efisien. Dengan Prospera, nikmati 
              pengalaman transaksi kasir anti-lag yang terintegrasi langsung dengan dasbor 
              analitik dan sistem AI proaktif untuk mengamankan aset bisnis Anda.
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="login-right">
          <h1 className="login-title">Selamat Datang di Prospera!</h1>
          <p className="login-subtitle">Masuk ke Akun Anda</p>

          <div className="d-flex mb-4" style={{ gap: '1rem' }}>
            <button 
              type="button"
              className={`btn flex-grow-1 rounded-pill ${activeTab === 'owner' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('owner')}
              style={{ fontWeight: 600, padding: '0.6rem' }}
            >
              Owner
            </button>
            <button 
              type="button"
              className={`btn flex-grow-1 rounded-pill ${activeTab === 'karyawan' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('karyawan')}
              style={{ fontWeight: 600, padding: '0.6rem' }}
            >
              Karyawan
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="alert alert-danger py-2 fs-6 rounded-3">{errors.root.message}</div>
            )}
            
            <div className="prospera-form-group">
              <label className="prospera-form-label">Alamat Email</label>
              <div className="prospera-input-wrapper">
                <Mail size={18} className="prospera-input-icon" />
                <input 
                  type="email" 
                  className={`prospera-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Masukkan alamat email anda"
                  {...register("email")}
                />
              </div>
              {errors.email && <div className="text-danger small mt-1 ms-2">{errors.email.message}</div>}
            </div>

            <div className="prospera-form-group mb-2">
              <label className="prospera-form-label">Kata Sandi</label>
              <div className="prospera-input-wrapper">
                <Lock size={18} className="prospera-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"}
                  className={`prospera-input ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Masukkan kata sandi anda"
                  {...register("password")}
                />
                <button 
                  type="button"
                  className="prospera-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {errors.password && <div className="text-danger small mt-1 ms-2">{errors.password.message}</div>}
            </div>

            <div className="text-end mb-4">
              <a href="#" className="text-muted small text-decoration-none fw-medium">Lupa Password?</a>
            </div>

            <button type="submit" className="prospera-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>

            {activeTab === 'owner' && (
              <div className="text-center mt-4">
                <p className="text-muted small">
                  Belum Punya Akun? <Link to="/register" className="prospera-link">Daftar Sekarang</Link>
                </p>
              </div>
            )}
            
            <div className="text-center mt-4 text-muted" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              &copy; 2026 PROSPERA All Rights Reserved
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}