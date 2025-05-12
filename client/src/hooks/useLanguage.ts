import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  // Change language and save preference
  const changeLanguage = useCallback((language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isSpanish: i18n.language === 'es',
    isEnglish: i18n.language === 'en'
  };
};
