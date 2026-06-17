import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, id, options = [], placeholder, className = '', ...rest },
  ref
) {
  const selectId = id || rest.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--color-text)] mb-1.5 block"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-md border px-3.5 py-2.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] ${
          error
            ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950'
            : 'border-[var(--color-border)]'
        } ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

export default Select;
