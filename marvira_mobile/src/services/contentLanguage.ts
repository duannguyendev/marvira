import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LanguageCode, SUPPORTED_LANGUAGES } from '../i18n';

export const ALL_LANGUAGES_STORAGE_KEY = '@marvira/all_languages';

export type ContentLanguage = LanguageCode;

export function getAppContentLanguage(): ContentLanguage {
  const code = i18n.language as string;
  if (SUPPORTED_LANGUAGES.some(l => l.code === code)) {
    return code as ContentLanguage;
  }
  return 'vi';
}

export async function getShowAllLanguages(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ALL_LANGUAGES_STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setShowAllLanguages(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    ALL_LANGUAGES_STORAGE_KEY,
    enabled ? 'true' : 'false',
  );
}

/** Query value for list endpoints: language code or "all". */
export async function getContentLanguageQuery(): Promise<string> {
  if (await getShowAllLanguages()) {
    return 'all';
  }
  return getAppContentLanguage();
}
