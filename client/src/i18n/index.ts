/**
 * i18n configuration — react-i18next
 * Supports: English (en), extendable to any locale
 * RTL support: handled via <html dir="rtl"> and CSS logical properties
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Automatically discover all locale files in ./locales/*.json
// Adding fr.json, hi.json, es.json automatically loads without modifying code
const localeModules = import.meta.glob<Record<string, unknown>>('./locales/*.json', {
  eager: true,
  import: 'default',
});

const resources: Record<string, { translation: Record<string, unknown> }> = {};

for (const path in localeModules) {
  const match = path.match(/\/([^/]+)\.json$/);
  if (match) {
    const lang = match[1];
    resources[lang] = { translation: localeModules[path] };
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  returnNull: false,
});

export default i18n;
