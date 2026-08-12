import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadStoredLanguage } from '../i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadStoredLanguage().finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
