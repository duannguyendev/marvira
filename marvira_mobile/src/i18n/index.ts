import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

export const LANGUAGE_STORAGE_KEY = '@marvira/language';

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', labelKey: 'settings.languages.vi' },
  { code: 'en', labelKey: 'settings.languages.en' },
  { code: 'zh', labelKey: 'settings.languages.zh' },
  { code: 'ja', labelKey: 'settings.languages.ja' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  zh: { translation: zh },
  ja: { translation: ja },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'vi',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export async function loadStoredLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // Keep default Vietnamese
  }
}

export async function setAppLanguage(language: LanguageCode): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
