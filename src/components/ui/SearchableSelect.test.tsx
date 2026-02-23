import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchableSelect from './SearchableSelect';

const options = [
  { value: 'furina', label: 'Furina', sublabel: '5★ Hydro Sword' },
  { value: 'kazuha', label: 'Kaedehara Kazuha', sublabel: '5★ Anemo Sword' },
  { value: 'bennett', label: 'Bennett', sublabel: '4★ Pyro Sword' },
  { value: 'xiangling', label: 'Xiangling', sublabel: '4★ Pyro Polearm' },
];

describe('SearchableSelect', () => {
  it('renders with label and placeholder', () => {
    render(
      <SearchableSelect
        label="Character"
        placeholder="Search..."
        options={options}
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Character')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('shows options on focus', async () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('Furina')).toBeInTheDocument();
    expect(screen.getByText('Bennett')).toBeInTheDocument();
  });

  it('filters options as user types', async () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    await userEvent.type(input, 'fur');

    expect(screen.getByText('Furina')).toBeInTheDocument();
    expect(screen.queryByText('Bennett')).not.toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect options={options} value="" onChange={onChange} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Furina');
    fireEvent.mouseDown(option);

    expect(onChange).toHaveBeenCalledWith('furina');
  });

  it('supports keyboard navigation', async () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect options={options} value="" onChange={onChange} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Arrow down to first option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('furina');
  });

  it('closes on Escape', () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('Furina')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText('Furina')).not.toBeInTheDocument();
  });

  it('shows "No matches found" when nothing matches', async () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} />
    );

    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'zzzzzzz');

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={vi.fn()}
        error="Required field"
      />
    );

    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('shows sublabels in dropdown', () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('5★ Hydro Sword')).toBeInTheDocument();
  });

  it('allows free text when allowFreeText is true', async () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={onChange}
        allowFreeText
      />
    );

    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'Custom Name');

    // Should be called for each keystroke with freeText
    expect(onChange).toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(
      <SearchableSelect options={options} value="" onChange={vi.fn()} disabled />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
