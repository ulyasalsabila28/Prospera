import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'modal-sm';
      case 'lg': return 'modal-lg';
      case 'xl': return 'modal-xl';
      default: return '';
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1050 }}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${getSizeClass()} ${className}`}>
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
          <div className="modal-header border-bottom-0 pb-0">
            {title && <h5 className="modal-title fw-bold">{title}</h5>}
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
