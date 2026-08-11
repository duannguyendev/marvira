import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import './src/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { I18nProvider } from './src/components/I18nProvider';
import { AlertProvider } from './src/components/AlertBottomSheet';
import { analytics } from './src/services/analytics';
import { initMapbox } from './src/utils/mapbox';
import { colors } from './src/theme';

initMapbox();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    return analytics.startAppOpenTracking();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <I18nProvider>
          <AlertProvider>
            <ErrorBoundary>
              <QueryClientProvider client={queryClient}>
                <View style={styles.container}>
                  <OfflineBanner />
                  <StatusBar
                    barStyle="light-content"
                    // On Android, keep status bar opaque so stack headers
                    // don't render under it (prevents title overlap).
                    backgroundColor={
                      Platform.OS === 'android' ? colors.primary : 'transparent'
                    }
                    translucent={Platform.OS === 'ios'}
                  />
                  <RootNavigator />
                </View>
              </QueryClientProvider>
            </ErrorBoundary>
          </AlertProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
