import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  return (
    <div className={wrapperClassName !== undefined && wrapperClassName !== '' ? wrapperClassName : 'mb-3'}>
      {label && (
        <label htmlFor={id} className="form-label fw-semibold">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        {...props}
      />
      {error && (
        <div className="invalid-feedback d-block">
          {error.message || error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
