import React from 'react';

const Card = ({ children, className = '', bodyClassName = '', title, headerContent, ...props }) => {
  return (
    <div className={`card shadow-sm border-0 ${className}`} style={{ borderRadius: '12px' }} {...props}>
      {(title || headerContent) && (
        <div className="card-header bg-transparent pt-4 pb-0 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {title && <h5 className="mb-0 fw-bold">{title}</h5>}
          {headerContent}
        </div>
      )}
      <div className={`card-body p-4 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
