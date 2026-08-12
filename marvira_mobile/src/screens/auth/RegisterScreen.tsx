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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  splashGradient,
} from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isRegistering, registerError } = useAuth();

  const [name, setName] = useState(__DEV__ ? 'John Doe' : '');
  const [email, setEmail] = useState(__DEV__ ? 'user@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [confirmPassword, setConfirmPassword] = useState(
    __DEV__ ? 'password123' : '',
  );
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

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

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    try {
      await register({ name, email, password });
    } catch (error: any) {
      appAlert.alert(
        t('auth.registrationFailed'),
        error.message || t('auth.pleaseTryAgain'),
      );
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
      <LinearGradient colors={[...splashGradient]} style={styles.gradient}>
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
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
            </View>

            <View style={styles.form}>
              <Input
                label={t('common.name')}
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                error={errors.name}
              />

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
                error={errors.password}
              />

              <Input
                label={t('common.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
              />

              {registerError && (
                <Text style={styles.errorText}>
                  {(registerError as any).message ||
                    t('auth.registrationFailedShort')}
                </Text>
              )}

              <Button
                title={t('auth.signUp')}
                onPress={handleRegister}
                loading={isRegistering}
                fullWidth
                style={styles.button}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate('Login')}>
                  {t('auth.signIn')}
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
    backgroundColor: colors.primary,
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
  button: {
    marginTop: spacing.md,
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
