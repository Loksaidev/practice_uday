import i18n from '@/i18n/config';

export const tOrg = (key: string, fallback: string, orgId?: string, orgSlug?: string): string => {
  const currentLang = i18n.language;

  if (currentLang === 'es') {
    const translated = i18n.t(key, { ns: 'nest-egg', defaultValue: null });
    if (translated !== null && translated !== key) {
      return translated;
    }
  }

  return fallback;
};