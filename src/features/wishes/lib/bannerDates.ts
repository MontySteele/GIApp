import type { PlannedBanner } from '@/types';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const DAY_MS = 86_400_000;

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOnly(value: string): string | null {
  return value.match(DATE_ONLY_PATTERN)?.[0] ?? null;
}

export function parseDateOnly(value: string, endOfDay = false): Date | null {
  const match = value.match(DATE_ONLY_PATTERN);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

export function addDaysToDateInput(value: string, days: number): string {
  const date = parseDateOnly(value) ?? new Date();
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export function getInitialDateRange(): { start: string; end: string } {
  const start = formatDateInput(new Date());
  return { start, end: addDaysToDateInput(start, 20) };
}

export function formatBannerDate(value: string): string {
  const date = parseDateOnly(value);
  if (!date) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getBannerTimingLabel(banner: PlannedBanner): string {
  const start = parseDateOnly(banner.expectedStartDate);
  const end = parseDateOnly(banner.expectedEndDate, true);
  const now = Date.now();

  if (!start || !end) return 'Needs dates';
  if (end.getTime() < now) return 'Ended';
  if (start.getTime() <= now && end.getTime() >= now) return 'Live now';

  const days = Math.ceil((start.getTime() - now) / DAY_MS);
  if (days <= 0) return 'Starts today';
  return days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`;
}
