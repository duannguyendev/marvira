import React from 'react';
import { AppState, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight } from '../theme';

/** Wait before showing offline to ignore NetInfo blips on app resume. */
const OFFLINE_CONFIRM_MS = 1500;

function isConfirmedOffline(state: NetInfoState): boolean {
  // null = still checking; treat as online until NetInfo confirms otherwise
  if (state.isConnected === false) {
    return true;
  }
  if (state.isConnected === true && state.isInternetReachable === false) {
    return true;
  }
  return false;
}

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = React.useState(false);
  const confirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const clearConfirmTimer = () => {
      if (confirmTimerRef.current != null) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    };

    const applyNetInfoState = (state: NetInfoState) => {
      if (!isConfirmedOffline(state)) {
        clearConfirmTimer();
        setIsOffline(false);
        return;
      }

      // Already waiting to confirm offline
      if (confirmTimerRef.current != null) {
        return;
      }

      confirmTimerRef.current = setTimeout(() => {
        confirmTimerRef.current = null;
        setIsOffline(true);
      }, OFFLINE_CONFIRM_MS);
    };

    const unsubscribe = NetInfo.addEventListener(applyNetInfoState);

    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        // Fresh check on foreground; ignore any stale offline flash
        clearConfirmTimer();
        setIsOffline(false);
        void NetInfo.fetch().then(applyNetInfoState);
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
      clearConfirmTimer();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.text}>{t('offline.noConnection')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  text: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
