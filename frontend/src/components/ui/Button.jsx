import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline-primary
  size = 'md', // sm, md, lg
  className = '',
  disabled = false,
  isLoading = false,
  onClick,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-primary';
      case 'secondary': return 'btn-secondary';
      case 'danger': return 'btn-danger';
      case 'warning': return 'btn-warning';
      case 'success': return 'btn-success';
      case 'outline-primary': return 'btn-outline-primary';
      case 'outline-secondary': return 'btn-outline-secondary';
      case 'ghost': return 'btn-light bg-transparent border-0';
      default: return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'btn-sm';
      case 'lg': return 'btn-lg';
      default: return '';
    }
  };

  return (
    <button
      type={type}
      className={`btn ${getVariantClass()} ${getSizeClass()} d-inline-flex align-items-center justify-content-center ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Processing...
        </>
      ) : children}
    </button>
  );
};

export default Button;
