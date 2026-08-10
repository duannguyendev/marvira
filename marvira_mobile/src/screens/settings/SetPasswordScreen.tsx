import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, fontSize, fontWeight } from '../../theme';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'SetPassword'
>;

export const SetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.setPassword(password);
      await authService.applyUserUpdate(user);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      Alert.alert(t('auth.success'), t('settings.setPasswordSuccess'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('settings.setPasswordFailed'),
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
          <Text style={styles.title}>{t('settings.setPassword')}</Text>
          <Text style={styles.description}>
            {t('settings.setPasswordDescription')}
          </Text>

          <Input
            label={t('auth.newPassword')}
            placeholder={t('auth.newPasswordPlaceholder')}
            value={password}
            onChangeText={setPassword}
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
            title={t('settings.setPassword')}
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
