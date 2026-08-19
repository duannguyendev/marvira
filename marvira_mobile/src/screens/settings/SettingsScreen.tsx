import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SUPPORTED_LANGUAGES, LanguageCode, setAppLanguage } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { useShowAllLanguages } from '../../hooks/useContentLanguage';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../hooks/useNotifications';
import { ProfileStackParamList } from '../../navigation/types';
import { AuthProvider } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

type SettingsNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Settings'
>;

function providerLabelKey(provider: AuthProvider): string {
  switch (provider) {
    case 'GOOGLE':
      return 'settings.signedInWithGoogle';
    case 'APPLE':
      return 'settings.signedInWithApple';
    case 'FACEBOOK':
      return 'settings.signedInWithFacebook';
    default:
      return 'settings.signedInWithEmail';
  }
}

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SettingsNavigationProp>();
  const { user } = useAuth();
  const currentLanguage = i18n.language as LanguageCode;
  const { showAllLanguages, setShowAllLanguages } = useShowAllLanguages();
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const isSocialProvider =
    !!user?.provider && user.provider !== 'LOCAL';
  const hasPassword =
    user?.hasPassword === true ||
    (!isSocialProvider && user?.hasPassword !== false);

  const handleSelectLanguage = async (code: LanguageCode) => {
    if (code !== currentLanguage) {
      await setAppLanguage(code);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        {isSocialProvider && user?.provider ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>
              {t(providerLabelKey(user.provider))}
            </Text>
            <Text style={styles.infoHint}>
              {hasPassword
                ? t('settings.ssoWithPasswordHint')
                : t('settings.ssoPasswordHint')}
            </Text>
          </View>
        ) : null}
        {hasPassword ? (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}>
            <Text style={styles.menuLabel}>{t('settings.changePassword')}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SetPassword')}
            activeOpacity={0.7}>
            <Text style={styles.menuLabel}>{t('settings.setPassword')}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Feedback')}
          activeOpacity={0.7}>
          <Text style={styles.menuLabel}>{t('settings.sendFeedback')}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}>
          <Text style={styles.menuLabel}>{t('settings.notifications')}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.notificationPrefs')}
        </Text>
        <Text style={styles.sectionDescription}>
          {t('settings.notificationPrefsDescription')}
        </Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>
              {t('settings.gameplayNotifications')}
            </Text>
            <Text style={styles.toggleHint}>
              {t('settings.gameplayNotificationsHint')}
            </Text>
          </View>
          <Switch
            value={prefs?.gameplayEnabled ?? true}
            onValueChange={value => {
              updatePrefs.mutate({ gameplayEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>
              {t('settings.creatorNotifications')}
            </Text>
            <Text style={styles.toggleHint}>
              {t('settings.creatorNotificationsHint')}
            </Text>
          </View>
          <Switch
            value={prefs?.creatorEnabled ?? true}
            onValueChange={value => {
              updatePrefs.mutate({ creatorEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Text style={styles.sectionDescription}>
          {t('settings.languageDescription')}
        </Text>

        <View style={styles.languageList}>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = currentLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  isSelected && styles.languageOptionSelected,
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.languageLabel,
                    isSelected && styles.languageLabelSelected,
                  ]}>
                  {t(lang.labelKey)}
                </Text>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.contentLanguage')}
        </Text>
        <Text style={styles.sectionDescription}>
          {t('settings.contentLanguageDescription')}
        </Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>
              {t('settings.allLanguages')}
            </Text>
            <Text style={styles.toggleHint}>
              {t('settings.allLanguagesHint')}
            </Text>
          </View>
          <Switch
            value={showAllLanguages}
            onValueChange={value => {
              void setShowAllLanguages(value);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  languageList: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  menuLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
  },
  menuChevron: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  infoHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  languageOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  languageLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
  },
  languageLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  toggleHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
