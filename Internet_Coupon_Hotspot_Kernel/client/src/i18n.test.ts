import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { resources } from './i18n/config.js';
import {
  formatCurrency,
  formatDurationClock,
  formatDurationNatural,
  formatPercent,
  getIntlLocale,
} from './i18n/formatters.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LOCALE } from './i18n/types.js';

describe('i18n Multi-Language System (English, Amharic, Afaan Oromoo)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('defines the required supported languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('am');
    expect(codes).toContain('om');
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('loads all 16 namespaces for English, Amharic, and Afaan Oromoo', () => {
    const expectedNamespaces = [
      'common',
      'auth',
      'dashboard',
      'sessions',
      'gateways',
      'portal',
      'customers',
      'packages',
      'coupons',
      'payments',
      'analytics',
      'loyalty',
      'ai',
      'administration',
      'validation',
      'notifications',
    ];

    for (const lang of ['en', 'am', 'om'] as const) {
      for (const ns of expectedNamespaces) {
        expect(resources[lang]).toHaveProperty(ns);
        const bundle = (resources[lang] as Record<string, any>)[ns];
        expect(Object.keys(bundle).length).toBeGreaterThan(0);
      }
    }
  });

  it('translates core navigation and actions into Amharic', async () => {
    await i18n.changeLanguage('am');
    expect(i18n.language).toBe('am');

    expect(i18n.t('common:appName')).toContain('የኢንተርኔት ኩፖን');
    expect(i18n.t('common:dashboard')).toBe('ዳሽቦርድ');
    expect(i18n.t('common:liveSessions')).toBe('የቀጥታ ክፍለ-ጊዜዎች');
    expect(i18n.t('common:signOut')).toBe('ውጣ');
  });

  it('translates core navigation and actions into Afaan Oromoo', async () => {
    await i18n.changeLanguage('om');
    expect(i18n.language).toBe('om');

    expect(i18n.t('common:appName')).toContain('Kuuppoonii');
    expect(i18n.t('common:dashboard')).toBe('Daashboordii');
    expect(i18n.t('common:liveSessions')).toBe('Tajaajila Kallattii');
    expect(i18n.t('common:signOut')).toBe('Bahi');
  });

  describe('Locale-aware Formatters', () => {
    it('maps language code to correct Intl locale', () => {
      expect(getIntlLocale('en')).toBe('en-US');
      expect(getIntlLocale('am')).toBe('am-ET');
      expect(getIntlLocale('om')).toBe('om-ET');
    });

    it('formats currency correctly in USD and ETB', () => {
      const formattedUsd = formatCurrency(2500, 'USD', 'en');
      expect(formattedUsd).toContain('25.00');

      const formattedEtbAm = formatCurrency(50000, 'ETB', 'am');
      expect(formattedEtbAm).toMatch(/ETB|ብር|500/);

      const formattedEtbOm = formatCurrency(10000, 'ETB', 'om');
      expect(formattedEtbOm).toMatch(/ETB|100/);
    });

    it('formats duration clock HH:MM:SS', () => {
      expect(formatDurationClock(3665)).toBe('01:01:05');
      expect(formatDurationClock(0)).toBe('00:00:00');
      expect(formatDurationClock(59)).toBe('00:00:59');
    });

    it('formats duration natural labels in English, Amharic, and Afaan Oromoo', () => {
      expect(formatDurationNatural(5400, 'en')).toBe('1h 30m');
      expect(formatDurationNatural(5400, 'am')).toBe('1 ሰዓት ከ30 ደቂቃ');
      expect(formatDurationNatural(5400, 'om')).toBe("sa'aatii 1 fi daqiiqaa 30");

      expect(formatDurationNatural(3600, 'am')).toBe('1 ሰዓት');
      expect(formatDurationNatural(1800, 'am')).toBe('30 ደቂቃ');
    });

    it('formats percentages accurately', () => {
      expect(formatPercent(0.75, 'en')).toBe('75%');
      expect(formatPercent(0.755, 'en')).toBe('75.5%');
    });
  });
});
