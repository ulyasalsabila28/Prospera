import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { apiFetch, formatError } from "../utils/api";
import heroImg1 from "../assets/kasair_local_boutique.png";
import heroImg2 from "../assets/prospera_slide_2.png";
import heroImg3 from "../assets/prospera_slide_3.png";
import heroImg4 from "../assets/prospera_slide_4.png";

const slides = [heroImg1, heroImg2, heroImg3, heroImg4];

const registerSchema = z.object({
  username: z.string().min(3, "Nama Lengkap minimal 3 karakter.").max(100, "Maksimal 100 karakter."),
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  phone_number: z.string().trim()
    .transform((val) => val === "" ? undefined : val)
    .refine((val) => val === undefined || /^\+?[0-9]{10,15}$/.test(val), {
      message: "Nomor handphone tidak valid (10-15 digit, opsional tanda '+').",
    }),
  password: z.string().min(6, "Password minimal 6 karakter.").max(64, "Password maksimal 64 karakter."),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter."),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "Anda harus menyetujui Ketentuan Layanan" }),
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Ketik ulang kata sandi tidak cocok.",
  path: ["confirmPassword"],
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(() => {
    return parseInt(sessionStorage.getItem("authSlideIndex") || "0", 10);
  });
  const nav = useNavigate();

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", phone_number: "", password: "", confirmPassword: "", agreeTerms: false }
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

  const onSubmit = async (data) => {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          username: data.username.trim(), 
          email: data.email.trim().toLowerCase(), 
          phone_number: data.phone_number.trim(),
          password: data.password 
        })
      });
      
      nav("/login", { state: { successMessage: "Pendaftaran berhasil! Silakan login untuk masuk ke toko Anda." } });
    } catch (err) {
      const msg = err.message || formatError(err);
      if (msg.toLowerCase().includes("email")) {
        setError("email", { message: msg });
      } else if (msg.toLowerCase().includes("handphone") || msg.toLowerCase().includes("telepon")) {
        setError("phone_number", { message: msg });
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
          <h1 className="login-title">Selamat datang di Prospera!</h1>
          <p className="login-subtitle">Registrasi akun Prospera anda.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="alert alert-danger py-2 fs-6 rounded-3">{errors.root.message}</div>
            )}
            
            <div className="prospera-form-group">
              <label className="prospera-form-label">Nama Lengkap</label>
              <div className="prospera-input-wrapper">
                <User size={18} className="prospera-input-icon" />
                <input 
                  type="text" 
                  className={`prospera-input ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Masukkan nama lengkap anda"
                  {...register("username")}
                />
              </div>
              {errors.username && <div className="text-danger small mt-1 ms-2">{errors.username.message}</div>}
            </div>

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

            <div className="prospera-form-group">
              <label className="prospera-form-label">Nomor Handphone</label>
              <div className="prospera-input-wrapper">
                <Phone size={18} className="prospera-input-icon" />
                <input 
                  type="text" 
                  className={`prospera-input ${errors.phone_number ? 'is-invalid' : ''}`}
                  placeholder="Masukkan nomor handphone anda"
                  {...register("phone_number")}
                />
              </div>
              {errors.phone_number && <div className="text-danger small mt-1 ms-2">{errors.phone_number.message}</div>}
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="prospera-form-group">
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
              </div>

              <div className="col-12 col-md-6">
                <div className="prospera-form-group">
                  <label className="prospera-form-label">Ketik Ulang Kata Sandi</label>
                  <div className="prospera-input-wrapper">
                    <Lock size={18} className="prospera-input-icon" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      className={`prospera-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Ketik ulang kata sandi anda"
                      {...register("confirmPassword")}
                    />
                    <button 
                      type="button"
                      className="prospera-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="text-danger small mt-1 ms-2">{errors.confirmPassword.message}</div>}
                </div>
              </div>
            </div>

            <div className="form-check mt-3 mb-4 d-flex align-items-center">
              <input 
                className={`form-check-input mt-0 me-2 ${errors.agreeTerms ? 'is-invalid' : ''}`} 
                type="checkbox" 
                id="agreeTerms" 
                {...register("agreeTerms")}
              />
              <label className="form-check-label text-muted small" htmlFor="agreeTerms">
                Saya Menyetujui <a href="#" className="prospera-link" style={{ fontWeight: 'normal' }}>Ketentuan Layanan</a>, Serta <a href="#" className="prospera-link" style={{ fontWeight: 'normal' }}>Kebijakan Privasi</a> Prospera
              </label>
            </div>
            {errors.agreeTerms && <div className="text-danger small" style={{ marginTop: '-15px', marginBottom: '15px', marginLeft: '25px' }}>{errors.agreeTerms.message}</div>}

            <button type="submit" className="prospera-btn mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </button>

            <div className="text-center mt-4">
              <p className="text-muted small">
                Sudah Punya Akun? <Link to="/login" className="prospera-link">Klik Untuk Login</Link>
              </p>
            </div>
            
            <div className="text-center mt-4 text-muted" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              &copy; 2026 PROSPERA All Rights Reserved
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
