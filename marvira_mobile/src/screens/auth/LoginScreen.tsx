import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { storage } from '../../utils/storage';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {
    login,
    loginWithGoogle,
    loginWithApple,
    loginWithFacebook,
    isLoggingIn,
    isSocialPending,
    loginError,
    appleAvailable,
    isSocialCancelled,
  } = useAuth();

  const [email, setEmail] = useState(__DEV__ ? 'demo@marvira.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'demo123' : '');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const busy = isLoggingIn || isSocialPending;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await storage.getRememberedCredentials();
      if (cancelled || !saved) {
        return;
      }
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('validation.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      await login({ email, password });
      if (rememberMe) {
        await storage.setRememberedCredentials(email, password);
      } else {
        await storage.clearRememberedCredentials();
      }
    } catch (error: any) {
      Alert.alert(
        t('auth.loginFailed'),
        error.message || t('auth.pleaseTryAgain'),
      );
    }
  };

  const handleSocialError = (error: unknown) => {
    if (isSocialCancelled(error)) {
      return;
    }
    const message =
      error instanceof Error ? error.message : t('auth.pleaseTryAgain');
    Alert.alert(t('auth.loginFailed'), message);
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      handleSocialError(error);
    }
  };

  const handleApple = async () => {
    try {
      await loginWithApple();
    } catch (error) {
      handleSocialError(error);
    }
  };

  const handleFacebook = async () => {
    try {
      await loginWithFacebook();
    } catch (error) {
      handleSocialError(error);
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
            <View style={styles.header}>
              <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
              <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
            </View>

            <View style={styles.form}>
              <Input
                label={t('common.email')}
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />

              <Input
                label={t('common.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                error={errors.password}
              />

              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(prev => !prev)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  hitSlop={8}>
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}>
                    {rememberMe ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.rememberLabel}>{t('auth.rememberMe')}</Text>
                </Pressable>

                <Text
                  style={styles.forgotLink}
                  onPress={() => navigation.navigate('ForgotPassword')}>
                  {t('auth.forgotPassword')}
                </Text>
              </View>

              {loginError && (
                <Text style={styles.errorText}>
                  {(loginError as any).message || t('auth.loginFailedShort')}
                </Text>
              )}

              <Button
                title={t('auth.signIn')}
                onPress={handleLogin}
                loading={isLoggingIn}
                disabled={busy}
                fullWidth
                style={styles.button}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title={t('auth.continueWithGoogle')}
                onPress={handleGoogle}
                loading={isSocialPending}
                disabled={busy}
                variant="outline"
                fullWidth
                style={styles.socialButton}
              />

              {appleAvailable && (
                <Button
                  title={t('auth.continueWithApple')}
                  onPress={handleApple}
                  loading={isSocialPending}
                  disabled={busy}
                  variant="outline"
                  fullWidth
                  style={styles.socialButton}
                />
              )}

              <Button
                title={t('auth.continueWithFacebook')}
                onPress={handleFacebook}
                loading={isSocialPending}
                disabled={busy}
                variant="outline"
                fullWidth
                style={styles.socialButton}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate('Register')}>
                  {t('auth.signUp')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.sm,
  },
  rememberLabel: {
    fontSize: fontSize.sm,
    color: colors.textDark,
  },
  button: {
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  socialButton: {
    marginTop: spacing.sm,
  },
  forgotLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    textAlign: 'right',
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
