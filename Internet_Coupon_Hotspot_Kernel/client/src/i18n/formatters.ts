import type { SupportedLocale } from './types.js';

export function getIntlLocale(locale: SupportedLocale): string {
  switch (locale) {
    case 'am':
      return 'am-ET';
    case 'om':
      return 'om-ET';
    case 'en':
    default:
      return 'en-US';
  }
}

/**
 * Formats minor currency units (e.g. 250 cents) into a locale-aware currency string.
 * Preserves the exact currency code (USD, ETB, EUR, KES).
 */
export function formatCurrency(
  amountMinor: number,
  currency = 'USD',
  locale: SupportedLocale = 'en'
): string {
  const major = (amountMinor || 0) / 100;
  const intlLocale = getIntlLocale(locale);

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

/**
 * Formats a number with locale-aware thousand separators and decimal marks.
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const intlLocale = getIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLocale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Formats a percentage value (e.g. 0.85 -> 85%).
 */
export function formatPercent(
  value: number,
  locale: SupportedLocale = 'en'
): string {
  const intlLocale = getIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(1)}%`;
  }
}

/**
 * Formats an ISO date-time string into a localized date string.
 */
export function formatDate(
  isoDate: string | Date | null | undefined,
  locale: SupportedLocale = 'en'
): string {
  if (!isoDate) return 'N/A';
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (isNaN(date.getTime())) return 'N/A';

  const intlLocale = getIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Formats an ISO date-time string into localized time string.
 */
export function formatTime(
  isoDate: string | Date | null | undefined,
  locale: SupportedLocale = 'en'
): string {
  if (!isoDate) return 'N/A';
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (isNaN(date.getTime())) return 'N/A';

  const intlLocale = getIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return date.toTimeString().slice(0, 8);
  }
}

/**
 * Formats duration seconds into readable time string (HH:MM:SS or natural label).
 */
export function formatDurationClock(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationNatural(
  seconds: number,
  locale: SupportedLocale = 'en'
): string {
  if (seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (locale === 'am') {
    if (hours > 0 && minutes > 0) return `${hours} ሰዓት ከ${minutes} ደቂቃ`;
    if (hours > 0) return `${hours} ሰዓት`;
    return `${minutes} ደቂቃ`;
  }

  if (locale === 'om') {
    if (hours > 0 && minutes > 0) return `sa'aatii ${hours} fi daqiiqaa ${minutes}`;
    if (hours > 0) return `sa'aatii ${hours}`;
    return `daqiiqaa ${minutes}`;
  }

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}
