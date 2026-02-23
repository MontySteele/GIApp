import { useState, useRef, useEffect, useCallback, useId } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Allow free text that isn't in the option list */
  allowFreeText?: boolean;
  required?: boolean;
}

export default function SearchableSelect({
  label,
  placeholder = 'Search...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  allowFreeText = false,
  required,
}: SearchableSelectProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const listboxId = `${id}-listbox`;

  // Find the display label for the current value
  const selectedOption = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query when value changes externally
  useEffect(() => {
    const opt = options.find((o) => o.value === value);
    setQuery(opt?.label ?? value);
  }, [value, options]);

  const filtered = query.trim()
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q);
      })
    : options;

  const selectOption = useCallback(
    (opt: SearchableOption) => {
      onChange(opt.value);
      setQuery(opt.label);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setHighlightIndex(-1);
    if (allowFreeText) {
      onChange(val);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Select all text on focus for easy replacement
    inputRef.current?.select();
  };

  const handleBlur = () => {
    // Delay to allow click on option
    setTimeout(() => {
      setIsOpen(false);
      // If not free text, revert to selected option label
      if (!allowFreeText && !options.find((o) => o.label === query)) {
        const opt = options.find((o) => o.value === value);
        setQuery(opt?.label ?? value);
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          const option = filtered[highlightIndex];
          if (option) selectOption(option);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={highlightIndex >= 0 ? `${id}-option-${highlightIndex}` : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        autoComplete="off"
        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
      />

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg"
        >
          {filtered.slice(0, 50).map((opt, i) => (
            <li
              key={opt.value}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={opt.value === value}
              className={`px-3 py-2 cursor-pointer text-sm ${
                i === highlightIndex
                  ? 'bg-primary-600 text-white'
                  : opt.value === value
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-200 hover:bg-slate-700'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <div>{opt.label}</div>
              {opt.sublabel && (
                <div className="text-xs text-slate-400">{opt.sublabel}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg px-3 py-2 text-sm text-slate-400">
          No matches found
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
