import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Optional description text shown below the input */
  description?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, description, id: providedId, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-slate-700'
          } ${className}`}
          {...props}
        />
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

Input.displayName = 'Input';

export default Input;
