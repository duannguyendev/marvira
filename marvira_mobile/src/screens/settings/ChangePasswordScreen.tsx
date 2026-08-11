import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { appAlert } from '../../utils/appAlert';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProfileStackParamList } from '../../navigation/types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../theme';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ChangePassword'
>;

export const ChangePasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      appAlert.alert(t('common.error'), t('settings.changePasswordFieldsRequired'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }
    if (newPassword.length < 6) {
      appAlert.alert(t('common.error'), t('validation.passwordMinLength'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      appAlert.alert(t('common.error'), t('validation.passwordsDoNotMatch'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }
    if (currentPassword === newPassword) {
      appAlert.alert(t('common.error'), t('settings.changePasswordSameAsCurrent'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      appAlert.alert(t('auth.success'), t('settings.changePasswordSuccess'), [
        {
          text: t('common.ok'),
          onPress: async () => {
            try {
              await logout();
            } catch {
              // Session already invalidated server-side
            }
          },
        },
      ]);
    } catch (error: any) {
      appAlert.alert(
        t('common.error'),
        error.message || t('settings.changePasswordFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.title}>{t('settings.changePassword')}</Text>
          <Text style={styles.description}>
            {t('settings.changePasswordDescription')}
          </Text>

          <Input
            label={t('settings.currentPassword')}
            placeholder={t('settings.currentPasswordPlaceholder')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Input
            label={t('auth.newPassword')}
            placeholder={t('auth.newPasswordPlaceholder')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Input
            label={t('common.confirmPassword')}
            placeholder={t('auth.confirmNewPasswordPlaceholder')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={t('auth.updatePassword')}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.button}
          />

          <Button
            title={t('common.cancel')}
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
            style={styles.cancel}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scroll: {
    flexGrow: 1,
  },
  section: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  cancel: {
    marginTop: spacing.sm,
  },
});
