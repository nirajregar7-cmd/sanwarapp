import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import bn from './locales/bn.json';
import pa from './locales/pa.json';

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  },
  te: {
    translation: te
  },
  ta: {
    translation: ta
  },
  kn: {
    translation: kn
  },
  ml: {
    translation: ml
  },
  mr: {
    translation: mr
  },
  gu: {
    translation: gu
  },
  bn: {
    translation: bn
  },
  pa: {
    translation: pa
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;