import React from 'react';

const Badge = ({ children, variant = 'primary', className = '', pill = false, ...props }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'bg-primary text-white';
      case 'secondary': return 'bg-secondary text-white';
      case 'success': return 'bg-success text-white';
      case 'danger': return 'bg-danger text-white';
      case 'warning': return 'bg-warning text-dark';
      case 'info': return 'bg-info text-dark';
      case 'light': return 'bg-light text-dark border';
      case 'dark': return 'bg-dark text-white';
      case 'soft-danger': return 'bg-danger bg-opacity-10 text-danger';
      case 'soft-success': return 'bg-success bg-opacity-10 text-success';
      case 'soft-warning': return 'bg-warning bg-opacity-10 text-warning';
      case 'gray': return 'bg-secondary bg-opacity-10 text-secondary';
      default: return 'bg-primary text-white';
    }
  };

  return (
    <span 
      className={`badge ${pill ? 'rounded-pill' : ''} ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
