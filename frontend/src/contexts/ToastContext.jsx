import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
                {toasts.map((toast) => (
                    <div 
                        key={toast.id} 
                        className={`toast show align-items-center text-bg-${toast.type} border-0 mb-2`} 
                        role="alert" 
                        aria-live="assertive" 
                        aria-atomic="true"
                        style={{
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                            animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        <div className="d-flex">
                            <div className="toast-body fw-medium" style={{ fontSize: '0.95rem' }}>
                                {toast.type === 'success' && <i className="fas fa-check-circle me-2"></i>}
                                {toast.type === 'danger' && <i className="fas fa-exclamation-circle me-2"></i>}
                                {toast.type === 'warning' && <i className="fas fa-exclamation-triangle me-2"></i>}
                                {toast.type === 'info' && <i className="fas fa-info-circle me-2"></i>}
                                {toast.message}
                            </div>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white me-2 m-auto" 
                                aria-label="Close"
                                onClick={() => removeToast(toast.id)}
                            ></button>
                        </div>
                    </div>
                ))}
            </div>
            
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
