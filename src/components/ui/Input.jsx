import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, id, type = 'text', className = '', ...rest },
  ref
) {
  const inputId = id || rest.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text)] mb-1.5 block"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`w-full rounded-md border px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder-gray-400 bg-[var(--color-surface)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] ${
          error
            ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950'
            : 'border-[var(--color-border)]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

export default Input;
