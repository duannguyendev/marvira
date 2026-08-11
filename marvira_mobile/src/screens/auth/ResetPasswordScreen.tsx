import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { appAlert } from '../../utils/appAlert';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ResetPassword'
>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim() || !password) {
      appAlert.alert(t('common.error'), t('auth.tokenPasswordRequired'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }
    if (password.length < 6) {
      appAlert.alert(t('common.error'), t('validation.passwordMinLength'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }
    if (password !== confirmPassword) {
      appAlert.alert(t('common.error'), t('validation.passwordsDoNotMatch'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      appAlert.alert(t('auth.success'), t('auth.passwordUpdated'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      appAlert.alert(
        t('common.error'),
        error.message || t('auth.resetPasswordFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gradient}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: spacing.lg + insets.top,
              paddingBottom: spacing.lg + insets.bottom,
              paddingLeft: spacing.lg + insets.left,
              paddingRight: spacing.lg + insets.right,
            },
          ]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
            <Input
              label={t('auth.resetToken')}
              placeholder={t('auth.resetTokenPlaceholder')}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
            />
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
              title={t('auth.updatePassword')}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.button}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.lg,
  },
  button: { marginTop: spacing.md },
});
