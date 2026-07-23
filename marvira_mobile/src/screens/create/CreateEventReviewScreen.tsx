import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StepIndicator } from '../../components/StepIndicator';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { useEventDetails } from '../../hooks/useEvents';
import { usePublishEvent } from '../../hooks/useMyEvents';
import { HomeStackParamList } from '../../navigation/types';
import { AnalyticsEvents, analytics } from '../../services/analytics';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { DEFAULT_MAP_REGION } from '../../utils/constants';

type CreateEventReviewRouteProp = RouteProp<
  HomeStackParamList,
  'CreateEventReview'
>;

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'CreateEventReview'
>;

type AccessMode = 'public' | 'password';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.28;
const STEP_LABELS = ['info', 'places', 'review', 'done'];

export const CreateEventReviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<CreateEventReviewRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { eventId } = route.params;
  const { data, isLoading, error, refetch } = useEventDetails(eventId);
  const publishEvent = usePublishEvent();

  const [accessMode, setAccessMode] = useState<AccessMode>('public');
  const [joinPassword, setJoinPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessErrors, setAccessErrors] = useState<{
    joinPassword?: string;
    confirmPassword?: string;
  }>({});
  const [giftTeaser, setGiftTeaser] = useState('');
  const [completionMessage, setCompletionMessage] = useState('');
  const [giftCodesText, setGiftCodesText] = useState('');
  const [giftError, setGiftError] = useState<string | undefined>();
  const giftsInitialized = useRef(false);

  const event = data?.data;

  useEffect(() => {
    if (!event || giftsInitialized.current) return;
    giftsInitialized.current = true;
    setGiftTeaser(event.giftTeaser ?? '');
    setCompletionMessage(event.completionMessage ?? '');
    setGiftCodesText((event.giftCodes ?? []).join('\n'));
  }, [event]);

  const parseGiftCodes = (text: string): string[] =>
    text
      .split(/[\n,]/)
      .map(c => c.trim())
      .filter(Boolean);

  const validateGifts = (): boolean => {
    const codes = parseGiftCodes(giftCodesText);
    if (codes.length > 10) {
      setGiftError(t('createEvent.gifts.validation.maxCodes'));
      return false;
    }
    if (codes.length > 0 && !giftTeaser.trim()) {
      setGiftError(t('createEvent.gifts.validation.teaserRequired'));
      return false;
    }
    const unique = new Set(codes.map(c => c.toLowerCase()));
    if (unique.size !== codes.length) {
      setGiftError(t('createEvent.gifts.validation.unique'));
      return false;
    }
    setGiftError(undefined);
    return true;
  };

  const validateAccess = (): boolean => {
    if (accessMode === 'public') {
      setAccessErrors({});
      return true;
    }
    const nextErrors: { joinPassword?: string; confirmPassword?: string } = {};
    if (joinPassword.length < 4) {
      nextErrors.joinPassword = t('createEvent.access.validation.passwordMin');
    }
    if (joinPassword !== confirmPassword) {
      nextErrors.confirmPassword = t(
        'createEvent.access.validation.passwordMismatch',
      );
    }
    setAccessErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateAccess() || !validateGifts()) {
      return;
    }
    const codes = parseGiftCodes(giftCodesText);
    try {
      await publishEvent.mutateAsync({
        eventId,
        ...(accessMode === 'password'
          ? { joinPassword }
          : { clearJoinPassword: true }),
        giftTeaser: giftTeaser.trim() || null,
        completionMessage: completionMessage.trim() || null,
        giftCodes: codes,
      });
      void AnalyticsEvents.eventPublished(eventId);
      navigation.navigate('CreateEventSuccess', {
        eventId,
        published: true,
        ...(accessMode === 'password' ? { joinPassword } : {}),
      });
    } catch (err: any) {
      analytics.recordError(err);
      Alert.alert(
        t('common.error'),
        err?.response?.data?.message ||
          err.message ||
          t('createEvent.publishFailed'),
      );
    }
  };

  const handleSaveDraft = () => {
    navigation.navigate('CreateEventSuccess', { eventId, published: false });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !event) {
    return (
      <ErrorView
        message={(error as any)?.message || t('events.detailsLoadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  const allPlacesHaveQuestions = event.places.length > 0;
  const mapRegion =
    event.places.length > 0
      ? {
          latitude: event.places[0].location.latitude,
          longitude: event.places[0].location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : DEFAULT_MAP_REGION;

  return (
    <View style={styles.container}>
      <StepIndicator
        currentStep={3}
        totalSteps={4}
        labels={STEP_LABELS.map(key => t(`createEvent.steps.${key}`))}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('createEvent.reviewHeading')}</Text>
        <Text style={styles.subheading}>
          {t('createEvent.reviewSubheading')}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>
            {event.city} · {event.totalPlaces} {t('common.places')} ·{' '}
            {event.rewardPoints} {t('common.pts')}
          </Text>
        </View>

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          scrollEnabled={false}>
          {event.places.map((place, index) => (
            <Marker
              key={place.id}
              coordinate={place.location}
              title={place.name}
              description={`#${index + 1}`}
            />
          ))}
        </MapView>

        <View style={styles.accessSection}>
          <Text style={styles.accessTitle}>
            {t('createEvent.access.heading')}
          </Text>
          <Text style={styles.accessSubheading}>
            {t('createEvent.access.subheading')}
          </Text>
          <View style={styles.accessRow}>
            {(['public', 'password'] as AccessMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.accessButton,
                  accessMode === mode && styles.accessButtonActive,
                ]}
                onPress={() => setAccessMode(mode)}>
                <Text
                  style={[
                    styles.accessButtonText,
                    accessMode === mode && styles.accessButtonTextActive,
                  ]}>
                  {t(`createEvent.access.modes.${mode}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {accessMode === 'password' ? (
            <>
              <Input
                label={t('createEvent.access.passwordLabel')}
                value={joinPassword}
                onChangeText={setJoinPassword}
                placeholder={t('createEvent.access.passwordPlaceholder')}
                secureTextEntry
                error={accessErrors.joinPassword}
              />
              <Input
                label={t('createEvent.access.confirmPasswordLabel')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('createEvent.access.confirmPasswordPlaceholder')}
                secureTextEntry
                error={accessErrors.confirmPassword}
              />
              <Text style={styles.accessHint}>
                {t('createEvent.access.hint')}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.accessSection}>
          <Text style={styles.accessTitle}>
            {t('createEvent.gifts.heading')}
          </Text>
          <Text style={styles.accessSubheading}>
            {t('createEvent.gifts.subheading')}
          </Text>
          <Input
            label={t('createEvent.gifts.teaserLabel')}
            value={giftTeaser}
            onChangeText={setGiftTeaser}
            placeholder={t('createEvent.gifts.teaserPlaceholder')}
            maxLength={80}
          />
          <Input
            label={t('createEvent.gifts.messageLabel')}
            value={completionMessage}
            onChangeText={setCompletionMessage}
            placeholder={t('createEvent.gifts.messagePlaceholder')}
            multiline
          />
          <Input
            label={t('createEvent.gifts.codesLabel')}
            value={giftCodesText}
            onChangeText={setGiftCodesText}
            placeholder={t('createEvent.gifts.codesPlaceholder')}
            multiline
            error={giftError}
          />
          <Text style={styles.accessHint}>{t('createEvent.gifts.helper')}</Text>
          {parseGiftCodes(giftCodesText).length > 0 ? (
            <Text style={styles.previewLine}>
              {t('createEvent.gifts.preview', {
                teaser: giftTeaser.trim() || '—',
                count: parseGiftCodes(giftCodesText).length,
              })}
            </Text>
          ) : null}
        </View>

        <View style={styles.checklist}>
          <Text style={styles.checklistTitle}>
            {t('createEvent.checklist')}
          </Text>
          <Text style={styles.checkItem}>
            {allPlacesHaveQuestions ? '✓' : '○'}{' '}
            {t('createEvent.checkPlaces', { count: event.places.length })}
          </Text>
          <Text style={styles.checkItem}>
            {allPlacesHaveQuestions ? '✓' : '○'}{' '}
            {t('createEvent.checkQuestions')}
          </Text>
        </View>

        {event.places.map((place, index) => (
          <View key={place.id} style={styles.placeCard}>
            <Text style={styles.placeTitle}>
              {index + 1}. {place.name}
            </Text>
            <Text style={styles.placeDescription} numberOfLines={2}>
              {place.description}
            </Text>
          </View>
        ))}

        <Button
          title={t('createEvent.publishNow')}
          onPress={handlePublish}
          loading={publishEvent.isPending}
          disabled={!allPlacesHaveQuestions}
          fullWidth
          style={styles.button}
        />
        <Button
          title={t('createEvent.saveDraft')}
          onPress={handleSaveDraft}
          variant="outline"
          fullWidth
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  eventTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  map: {
    height: MAP_HEIGHT,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  accessSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  accessTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  accessSubheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  accessRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accessButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  accessButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accessButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  accessButtonTextActive: {
    color: colors.background,
  },
  accessHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewLine: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  checklist: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  checklistTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  checkItem: {
    fontSize: fontSize.sm,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  placeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  placeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  placeDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  button: {
    marginTop: spacing.sm,
  },
});
