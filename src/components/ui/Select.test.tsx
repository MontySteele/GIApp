import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  describe('rendering', () => {
    it('renders all options', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders with label when provided', () => {
      render(<Select options={defaultOptions} label="Choose an option" />);

      expect(screen.getByLabelText('Choose an option')).toBeInTheDocument();
    });

    it('renders without label when not provided', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Select options={defaultOptions} className="custom-select" />);

      expect(screen.getByRole('combobox')).toHaveClass('custom-select');
    });
  });

  describe('selection', () => {
    it('selects first option by default', () => {
      render(<Select options={defaultOptions} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option1');
    });

    it('respects defaultValue prop', () => {
      render(<Select options={defaultOptions} defaultValue="option2" />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });

    it('can be controlled via value prop', () => {
      render(<Select options={defaultOptions} value="option3" onChange={() => {}} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option3');
    });

    it('calls onChange when selection changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select options={defaultOptions} onChange={handleChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'option2');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      render(<Select options={defaultOptions} error="This field is required" />);

      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('applies error styling to select', () => {
      render(<Select options={defaultOptions} error="Error" />);

      expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
    });

    it('sets aria-invalid when error exists', () => {
      render(<Select options={defaultOptions} error="Error" />);

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when no error', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('description', () => {
    it('displays description text', () => {
      render(<Select options={defaultOptions} description="Choose wisely" />);

      expect(screen.getByText('Choose wisely')).toBeInTheDocument();
    });

    it('hides description when error is present', () => {
      render(
        <Select
          options={defaultOptions}
          description="Choose wisely"
          error="Error"
        />
      );

      expect(screen.queryByText('Choose wisely')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Select options={defaultOptions} disabled />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Select options={defaultOptions} disabled />);

      expect(screen.getByRole('combobox')).toHaveClass('disabled:opacity-50');
    });
  });

  describe('accessibility', () => {
    it('associates label with select', () => {
      render(<Select options={defaultOptions} label="Test Label" />);

      const select = screen.getByLabelText('Test Label');
      expect(select).toBeInTheDocument();
    });

    it('associates error with select via aria-describedby', () => {
      render(<Select options={defaultOptions} error="Error message" id="test-select" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
    });

    it('associates description with select via aria-describedby', () => {
      render(<Select options={defaultOptions} description="Help text" id="test-select" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', expect.stringContaining('description'));
    });

    it('combines multiple aria-describedby values', () => {
      render(
        <Select
          options={defaultOptions}
          error="Error"
          aria-describedby="external-help"
          id="test-select"
        />
      );

      const select = screen.getByRole('combobox');
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toContain('error');
      expect(describedBy).toContain('external-help');
    });

    it('has focus ring styles for keyboard navigation', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByRole('combobox')).toHaveClass('focus:ring-2');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to select element', () => {
      const ref = vi.fn();
      render(<Select ref={ref} options={defaultOptions} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('additional props', () => {
    it('passes through name prop', () => {
      render(<Select options={defaultOptions} name="mySelect" />);

      expect(screen.getByRole('combobox')).toHaveAttribute('name', 'mySelect');
    });

    it('passes through required prop', () => {
      render(<Select options={defaultOptions} required />);

      expect(screen.getByRole('combobox')).toBeRequired();
    });

    it('uses provided id', () => {
      render(<Select options={defaultOptions} id="custom-id" />);

      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'custom-id');
    });
  });
});
