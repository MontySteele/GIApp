import { useCallback } from 'react';
import { format, isValid } from 'date-fns';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

export type DateInput = Date | string | number;

interface DateFormatterOptions {
  includeTime?: boolean;
  formatOverride?: string;
}

const resolveFormat = (baseFormat: string, options?: DateFormatterOptions) => {
  const selectedFormat = options?.formatOverride ?? baseFormat ?? DEFAULT_SETTINGS.dateFormat;

  if (options?.includeTime) {
    return `${selectedFormat} p`;
  }

  return selectedFormat;
};

const parseDateInput = (value: DateInput) => {
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
};

export const formatDateValue = (value: DateInput, formatString: string) => {
  const date = parseDateInput(value);
  if (!date) return '';

  const safeFormat = formatString || DEFAULT_SETTINGS.dateFormat;

  try {
    return format(date, safeFormat);
  } catch {
    return format(date, DEFAULT_SETTINGS.dateFormat);
  }
};

export const formatDate = (value: DateInput, options?: DateFormatterOptions) => {
  const baseFormat = useUIStore.getState().settings.dateFormat ?? DEFAULT_SETTINGS.dateFormat;
  const formatString = resolveFormat(baseFormat, options);
  return formatDateValue(value, formatString);
};

export const useDateFormatter = (options?: DateFormatterOptions) => {
  const dateFormat = useUIStore((state) => state.settings.dateFormat);
  const formatString = resolveFormat(dateFormat, options);

  return useCallback(
    (value: DateInput) => formatDateValue(value, formatString),
    [formatString]
  );
};
