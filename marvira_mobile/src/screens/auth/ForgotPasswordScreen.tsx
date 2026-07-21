import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {authApi} from '../../api/auth';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../../theme';
import {AuthStackParamList} from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      Alert.alert(t('auth.checkEmailTitle'), t('auth.checkEmailMessage'), [
        {text: t('common.ok'), onPress: () => navigation.navigate('Login')},
      ]);
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.resetEmailFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>
            <Input
              label={t('common.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title={t('auth.sendResetLink')}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.button}
            />
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Login')}>
              {t('auth.backToSignIn')}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  scrollContent: {flexGrow: 1, justifyContent: 'center', padding: spacing.lg},
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  button: {marginTop: spacing.md},
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
