import { SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  /** Optional description text shown below the select */
  description?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, description, options, id: providedId, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;

    // Build aria-describedby from error, description, and any passed-in value
    const describedByParts: string[] = [];
    if (error) describedByParts.push(errorId);
    if (description) describedByParts.push(descriptionId);
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-slate-700'
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {description && !error && (
          <p id={descriptionId} className="mt-1.5 text-sm text-slate-400">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
