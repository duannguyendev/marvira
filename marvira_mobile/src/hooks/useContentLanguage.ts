import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getShowAllLanguages,
  setShowAllLanguages,
} from '../services/contentLanguage';

export function useShowAllLanguages() {
  const queryClient = useQueryClient();
  const [showAllLanguages, setShowAll] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getShowAllLanguages().then(value => {
      if (!cancelled) {
        setShowAll(value);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setShowAllLanguagesPreference = useCallback(
    async (enabled: boolean) => {
      setShowAll(enabled);
      await setShowAllLanguages(enabled);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['practice'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
    },
    [queryClient],
  );

  return {
    showAllLanguages,
    loaded,
    setShowAllLanguages: setShowAllLanguagesPreference,
  };
}
