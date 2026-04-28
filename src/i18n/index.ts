import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Locale, DEFAULT_LOCALE } from './constants';
import enUsLocale from './locales/translations/en-US.json';
import zhCNLocale from './locales/translations/zh-CN.json';
import jaJPLocale from './locales/translations/ja-JP.json';
import koKRLocale from './locales/translations/ko-KR.json';
import viVNLocale from './locales/translations/vi-VN.json';

const resources = {
  [Locale.EnglishUnitedStates]: {
    translation: enUsLocale
  },
  [Locale.ChineseSimplified]: {
    translation: zhCNLocale
  },
  [Locale.Japanese]: {
    translation: jaJPLocale
  },
  [Locale.Korean]: {
    translation: koKRLocale
  },
  [Locale.Vietnamese]: {
    translation: viVNLocale
  }
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });
}

export default i18n;
