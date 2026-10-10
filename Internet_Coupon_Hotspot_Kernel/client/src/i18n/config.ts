import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type SupportedLocale } from './types.js';

// Import all English locale modules
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enSessions from './locales/en/sessions.json';
import enGateways from './locales/en/gateways.json';
import enPortal from './locales/en/portal.json';
import enCustomers from './locales/en/customers.json';
import enPackages from './locales/en/packages.json';
import enCoupons from './locales/en/coupons.json';
import enPayments from './locales/en/payments.json';
import enAnalytics from './locales/en/analytics.json';
import enLoyalty from './locales/en/loyalty.json';
import enAi from './locales/en/ai.json';
import enAdministration from './locales/en/administration.json';
import enValidation from './locales/en/validation.json';
import enNotifications from './locales/en/notifications.json';

// Import all Amharic locale modules
import amCommon from './locales/am/common.json';
import amAuth from './locales/am/auth.json';
import amDashboard from './locales/am/dashboard.json';
import amSessions from './locales/am/sessions.json';
import amGateways from './locales/am/gateways.json';
import amPortal from './locales/am/portal.json';
import amCustomers from './locales/am/customers.json';
import amPackages from './locales/am/packages.json';
import amCoupons from './locales/am/coupons.json';
import amPayments from './locales/am/payments.json';
import amAnalytics from './locales/am/analytics.json';
import amLoyalty from './locales/am/loyalty.json';
import amAi from './locales/am/ai.json';
import amAdministration from './locales/am/administration.json';
import amValidation from './locales/am/validation.json';
import amNotifications from './locales/am/notifications.json';

// Import all Afaan Oromo locale modules
import omCommon from './locales/om/common.json';
import omAuth from './locales/om/auth.json';
import omDashboard from './locales/om/dashboard.json';
import omSessions from './locales/om/sessions.json';
import omGateways from './locales/om/gateways.json';
import omPortal from './locales/om/portal.json';
import omCustomers from './locales/om/customers.json';
import omPackages from './locales/om/packages.json';
import omCoupons from './locales/om/coupons.json';
import omPayments from './locales/om/payments.json';
import omAnalytics from './locales/om/analytics.json';
import omLoyalty from './locales/om/loyalty.json';
import omAi from './locales/om/ai.json';
import omAdministration from './locales/om/administration.json';
import omValidation from './locales/om/validation.json';
import omNotifications from './locales/om/notifications.json';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    sessions: enSessions,
    gateways: enGateways,
    portal: enPortal,
    customers: enCustomers,
    packages: enPackages,
    coupons: enCoupons,
    payments: enPayments,
    analytics: enAnalytics,
    loyalty: enLoyalty,
    ai: enAi,
    administration: enAdministration,
    validation: enValidation,
    notifications: enNotifications,
  },
  am: {
    common: amCommon,
    auth: amAuth,
    dashboard: amDashboard,
    sessions: amSessions,
    gateways: amGateways,
    portal: amPortal,
    customers: amCustomers,
    packages: amPackages,
    coupons: amCoupons,
    payments: amPayments,
    analytics: amAnalytics,
    loyalty: amLoyalty,
    ai: amAi,
    administration: amAdministration,
    validation: amValidation,
    notifications: amNotifications,
  },
  om: {
    common: omCommon,
    auth: omAuth,
    dashboard: omDashboard,
    sessions: omSessions,
    gateways: omGateways,
    portal: omPortal,
    customers: omCustomers,
    packages: omPackages,
    coupons: omCoupons,
    payments: omPayments,
    analytics: omAnalytics,
    loyalty: omLoyalty,
    ai: omAi,
    administration: omAdministration,
    validation: omValidation,
    notifications: omNotifications,
  },
} as const;

export function getInitialLanguage(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // 1. Explicitly saved user preference in localStorage
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
  if (saved && (saved === 'en' || saved === 'am' || saved === 'om')) {
    return saved;
  }

  // 2. Browser/Device language detection
  const navLang = (navigator.language || '').toLowerCase();
  if (navLang.startsWith('am')) return 'am';
  if (navLang.startsWith('om')) return 'om';
  if (navLang.startsWith('en')) return 'en';

  // 3. Fallback to English
  return DEFAULT_LOCALE;
}

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Keep document language and dir in sync with selected locale
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
  document.documentElement.dir = 'ltr';
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.dir = 'ltr';
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  }
});

export default i18n;
