import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch, formatError } from '../utils/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

const passwordSchema = z.object({
    oldPassword: z.string().min(1, "Password lama wajib diisi."),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter.").max(64, "Maksimal 64 karakter."),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"]
}).refine((data) => data.oldPassword !== data.newPassword, {
    message: "Password baru tidak boleh sama dengan yang lama.",
    path: ["newPassword"]
});

export default function ChangePasswordModal({ show, onClose }) {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: ""
        }
    });

    const handleClose = () => {
        reset();
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const res = await apiFetch("/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({ old_password: data.oldPassword, new_password: data.newPassword })
            });
            showToast(res.message || "Password berhasil diubah!", 'success');
            reset();
            setTimeout(() => handleClose(), 2000);
        } catch (err) {
            showToast(formatError(err), 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={show} 
            onClose={handleClose} 
            title={<><i className="fas fa-key me-2 text-primary"></i>Ganti Password</>}
        >
            
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Password Lama</label>
                    <div className="input-group">
                        <input 
                            type={showOldPassword ? "text" : "password"} 
                            className={`form-control ${errors.oldPassword ? 'is-invalid' : ''}`}
                            placeholder="Masukkan password saat ini"
                            {...register("oldPassword")}
                        />
                        <button 
                            className="btn btn-outline-secondary" 
                            type="button" 
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            tabIndex="-1"
                        >
                            <i className={`fas ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        {errors.oldPassword && <div className="invalid-feedback d-block">{errors.oldPassword.message}</div>}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Password Baru</label>
                    <div className="input-group">
                        <input 
                            type={showNewPassword ? "text" : "password"} 
                            className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                            placeholder="Minimal 6 karakter"
                            {...register("newPassword")}
                        />
                        <button 
                            className="btn btn-outline-secondary" 
                            type="button" 
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex="-1"
                        >
                            <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword.message}</div>}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Konfirmasi Password Baru</label>
                    <div className="input-group">
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            placeholder="Ulangi password baru"
                            {...register("confirmPassword")}
                        />
                        <button 
                            className="btn btn-outline-secondary" 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex="-1"
                        >
                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword.message}</div>}
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button variant="ghost" className="btn-light" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        Simpan Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
