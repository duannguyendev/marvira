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

function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/** Map device system locale to a supported app language (unsupported/failed → Vietnamese). */
export function resolveDeviceLanguage(): LanguageCode {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const languageCode = locale.split(/[-_]/)[0]?.toLowerCase();
    if (languageCode && isSupportedLanguage(languageCode)) {
      return languageCode;
    }
  } catch {
    // Fall through to Vietnamese
  }
  return 'vi';
}

const defaultLanguage = resolveDeviceLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export async function loadStoredLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      await i18n.changeLanguage(stored);
      return;
    }
    // First launch only: detect device language and persist so later launches keep it
    const language = resolveDeviceLanguage();
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    await i18n.changeLanguage(resolveDeviceLanguage());
  }
}

export async function setAppLanguage(language: LanguageCode): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
