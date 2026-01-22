import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import organizationEn from './locales/organization/en.json';
import organizationEs from './locales/organization/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
        organization: organizationEn.organization
      },
      es: {
        translation: es,
        organization: organizationEs.organization
      },
      fr: { translation: fr },
    },
    lng: typeof window !== 'undefined' ? (localStorage.getItem('knowsy-language') || 'en') : 'en',
    fallbackLng: 'en',
    ns: ['translation', 'organization'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });

// Function to load organization-specific translations
export const loadOrgTranslations = async (orgId: string, orgSlug: string, locale: string) => {
  if (locale === 'es') {
    try {
      const nestEggEs = await import('./nest-egg-es.json');
      i18n.addResourceBundle('es', 'nest-egg', nestEggEs, true, true);
    } catch (error) {
      console.warn('Failed to load nest-egg-es.json:', error);
    }
  }
};

export default i18n;
