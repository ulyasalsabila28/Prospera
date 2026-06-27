import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Ya, Lanjutkan',
        cancelText: 'Batal',
        onConfirm: null,
        isDanger: false,
        isLoading: false
    });

    const showConfirm = useCallback((options) => {
        setConfirmState({
            isOpen: true,
            title: options.title || 'Konfirmasi',
            message: options.message || 'Apakah Anda yakin?',
            confirmText: options.confirmText || 'Ya, Lanjutkan',
            cancelText: options.cancelText || 'Batal',
            onConfirm: options.onConfirm,
            isDanger: options.isDanger || false,
            isLoading: false
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = async () => {
        if (confirmState.onConfirm) {
            setConfirmState((prev) => ({ ...prev, isLoading: true }));
            try {
                await confirmState.onConfirm();
            } finally {
                closeConfirm();
            }
        } else {
            closeConfirm();
        }
    };

    return (
        <ConfirmContext.Provider value={{ showConfirm, closeConfirm }}>
            {children}
            
            {/* Custom Confirm Modal */}
            {confirmState.isOpen && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div 
                        className="modal fade show d-block" 
                        tabIndex="-1" 
                        role="dialog"
                        style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-body p-4 text-center">
                                    <div 
                                        className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
                                        style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            backgroundColor: confirmState.isDanger ? 'rgba(220, 53, 69, 0.1)' : 'rgba(13, 110, 253, 0.1)',
                                            color: confirmState.isDanger ? '#dc3545' : '#0d6efd'
                                        }}
                                    >
                                        <i className={`fas ${confirmState.isDanger ? 'fa-exclamation-triangle' : 'fa-question'} fs-3`}></i>
                                    </div>
                                    <h5 className="fw-bold text-body mb-2">{confirmState.title}</h5>
                                    <p className="text-muted mb-4">{confirmState.message}</p>
                                    
                                    <div className="d-flex gap-2 justify-content-center">
                                        <button 
                                            type="button" 
                                            className="btn btn-light rounded-pill px-4" 
                                            onClick={closeConfirm}
                                            disabled={confirmState.isLoading}
                                        >
                                            {confirmState.cancelText}
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${confirmState.isDanger ? 'btn-danger' : 'btn-primary'} rounded-pill px-4`} 
                                            onClick={handleConfirm}
                                            disabled={confirmState.isLoading}
                                        >
                                            {confirmState.isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Memproses...</>
                                            ) : (
                                                confirmState.confirmText
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ConfirmContext.Provider>
    );
};
