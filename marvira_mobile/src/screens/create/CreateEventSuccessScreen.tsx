import React from 'react';
import {View, Text, StyleSheet, Share} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StepIndicator} from '../../components/StepIndicator';
import {Button} from '../../components/Button';
import {HomeStackParamList, MainTabParamList} from '../../navigation/types';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../../theme';

type CreateEventSuccessRouteProp = RouteProp<HomeStackParamList, 'CreateEventSuccess'>;

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CreateEventSuccess'>;

const STEP_LABELS = ['info', 'places', 'review', 'done'];

export const CreateEventSuccessScreen: React.FC = () => {
  const {t} = useTranslation();
  const route = useRoute<CreateEventSuccessRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {eventId, published, joinPassword} = route.params;

  const handleSharePassword = async () => {
    if (!joinPassword) {
      return;
    }
    try {
      await Share.share({
        message: t('createEvent.access.shareMessage', {password: joinPassword}),
      });
    } catch {
      // user dismissed share sheet
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator
        currentStep={4}
        totalSteps={4}
        labels={STEP_LABELS.map(key => t(`createEvent.steps.${key}`))}
      />
      <View style={styles.content}>
        <Text style={styles.emoji}>{published ? '🎉' : '📝'}</Text>
        <Text style={styles.heading}>
          {published ? t('createEvent.successPublished') : t('createEvent.successDraft')}
        </Text>
        <Text style={styles.subheading}>
          {published
            ? joinPassword
              ? t('createEvent.successPublishedPrivateMessage')
              : t('createEvent.successPublishedMessage')
            : t('createEvent.successDraftMessage')}
        </Text>

        {published && joinPassword ? (
          <View style={styles.passwordCard}>
            <Text style={styles.passwordLabel}>{t('createEvent.access.passwordShareLabel')}</Text>
            <Text style={styles.passwordValue}>{joinPassword}</Text>
            <Text style={styles.passwordWarning}>{t('createEvent.access.passwordWarning')}</Text>
            <Button
              title={t('createEvent.access.shareInvite')}
              onPress={handleSharePassword}
              fullWidth
              style={styles.passwordButton}
            />
          </View>
        ) : null}

        <Button
          title={t('createEvent.viewMyEvents')}
          onPress={() =>
            navigation.getParent()?.navigate('Profile', {
              screen: 'MyEvents',
            } as MainTabParamList['Profile'])
          }
          fullWidth
          style={styles.button}
        />
        <Button
          title={t('createEvent.viewEventDetails')}
          onPress={() =>
            navigation.navigate('EventDetails', {eventId})
          }
          variant="outline"
          fullWidth
          style={styles.button}
        />
        <Button
          title={t('createEvent.createAnother')}
          onPress={() => navigation.replace('CreateEventInfo')}
          variant="outline"
          fullWidth
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  passwordCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  passwordValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  passwordWarning: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  passwordButton: {
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.sm,
    width: '100%',
  },
});
