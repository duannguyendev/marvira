import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from '../theme';

/** Shared indigo header + Android status-bar safe inset for stack titles. */
export const primaryStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.background,
  headerTitleStyle: {
    fontWeight: '600',
  },
  contentStyle: { backgroundColor: colors.backgroundLight },
  statusBarStyle: 'light',
  statusBarColor: colors.primary,
  /** Prevents header titles drawing under the system status bar on Android. */
  statusBarTranslucent: false,
};
