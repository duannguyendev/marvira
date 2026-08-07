import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Mapbox from '@rnmapbox/maps';
import {
  usePlaceQuestion,
  useSubmitAnswer,
  useUnlockPlace,
} from '../../hooks/usePlaces';
import { useLocation } from '../../hooks/useLocation';
import { useEventDetails } from '../../hooks/useEvents';
import { placesApi } from '../../api/places';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { MapPin } from '../../components/MapPin';
import {
  circlePolygon,
  MAPBOX_STYLE,
  zoomFromLatitudeDelta,
} from '../../utils/mapbox';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import {
  isWithinRange,
  formatDistance,
  calculateDistance,
} from '../../utils/distance';
import { LOCATION_ACCURACY_THRESHOLD } from '../../utils/constants';
import {
  buildLocationPayload,
  showLocationWarnings,
} from '../../utils/anticheat';
import { AnalyticsEvents, analytics } from '../../services/analytics';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;

/** Dedupe hunt_started per event for this app session. */
const huntStartedLogged = new Set<string>();

type PlaceGameScreenRouteProp = RouteProp<HomeStackParamList, 'PlaceGame'>;

type PlaceGameScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'PlaceGame'
>;

export const PlaceGameScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<PlaceGameScreenRouteProp>();
  const navigation = useNavigation<PlaceGameScreenNavigationProp>();
  const { eventId, placeId } = route.params;

  const {
    data: eventData,
    isLoading: eventLoading,
    refetch: refetchEvent,
  } = useEventDetails(eventId);
  const { location, error: locationError } = useLocation();
  const submitAnswerMutation = useSubmitAnswer();
  const unlockPlaceMutation = useUnlockPlace();

  const [answer, setAnswer] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [hadIncorrectAttempt, setHadIncorrectAttempt] = useState(false);
  const unlockAttemptedRef = useRef(false);
  const completingRef = useRef(false);

  const event = eventData?.data;
  const place = placesApi.getPlaceFromEvent(event?.places, placeId);
  const unlockRadius = place?.radiusMeters ?? 100;
  const isAccessible = place?.isAccessible ?? false;
  const isWithinAnswerRange =
    !!location &&
    !!place &&
    isWithinRange(location, place.location, unlockRadius);
  const hasGoodGpsAccuracy =
    !!location &&
    (!location.accuracy || location.accuracy <= LOCATION_ACCURACY_THRESHOLD);

  const { data: questionData, isLoading: questionLoading } = usePlaceQuestion(
    placeId,
    isUnlocked,
  );

  useEffect(() => {
    if (place) {
      setIsUnlocked(place.isUnlocked);
      unlockAttemptedRef.current = place.isUnlocked;
    }
  }, [place?.id, place?.isUnlocked]);

  useEffect(() => {
    if (!huntStartedLogged.has(eventId)) {
      huntStartedLogged.add(eventId);
      void AnalyticsEvents.huntStarted(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (completingRef.current) {
        return;
      }
      if (e.data.action.type === 'REPLACE') {
        return;
      }
      const placesDone =
        event?.places?.filter(p => p.isCompleted).length ?? undefined;
      void AnalyticsEvents.huntAbandoned(eventId, placesDone);
    });
    return unsubscribe;
  }, [navigation, eventId, event?.places]);

  const attemptUnlock = useCallback(async () => {
    if (!location || !place || isUnlocked || place.isCompleted) {
      return;
    }
    if (location.accuracy && location.accuracy > LOCATION_ACCURACY_THRESHOLD) {
      return;
    }
    if (!isWithinRange(location, place.location, unlockRadius)) {
      return;
    }
    if (unlockPlaceMutation.isPending || unlockAttemptedRef.current) {
      return;
    }

    unlockAttemptedRef.current = true;
    try {
      const result = await unlockPlaceMutation.mutateAsync({
        placeId,
        ...buildLocationPayload(location),
      });
      showLocationWarnings(result.warnings);
      setIsUnlocked(true);
      void AnalyticsEvents.placeUnlocked(eventId, placeId);
      await refetchEvent();
    } catch (error: any) {
      unlockAttemptedRef.current = false;
      analytics.recordError(error);
      Alert.alert(
        t('game.unlockFailed'),
        error.message || t('game.couldNotUnlock'),
      );
    }
  }, [
    location,
    place,
    isUnlocked,
    unlockRadius,
    placeId,
    eventId,
    unlockPlaceMutation,
    refetchEvent,
    t,
  ]);

  useEffect(() => {
    if (location && place) {
      const dist = calculateDistance(location, place.location);
      setDistance(dist);
      attemptUnlock();
    }
  }, [location, place, attemptUnlock]);

  const handleReportWrongAnswer = async () => {
    try {
      const result = await placesApi.reportWrongAnswer(placeId);
      Alert.alert(t('game.reportSentTitle'), result.message);
    } catch (error: any) {
      analytics.recordError(error);
      Alert.alert(
        t('common.error'),
        error?.response?.data?.message || error.message || t('common.error'),
      );
    }
  };

  const showIncorrectAlert = (message: string) => {
    Alert.alert(t('game.incorrect'), message || t('game.tryAgain'), [
      {
        text: t('game.reportProblem'),
        style: 'cancel',
        onPress: () => {
          void handleReportWrongAnswer();
        },
      },
      { text: t('game.tryAgain'), style: 'default' },
    ]);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      Alert.alert(t('common.error'), t('game.enterAnswer'));
      return;
    }

    if (!isUnlocked) {
      Alert.alert(
        t('game.notUnlocked'),
        t('game.mustBeWithin', { radius: unlockRadius }),
      );
      return;
    }

    if (!location) {
      Alert.alert(t('game.locationRequired'), t('game.enableGps'));
      return;
    }

    if (location.accuracy && location.accuracy > LOCATION_ACCURACY_THRESHOLD) {
      Alert.alert(t('game.locationRequired'), t('game.waitingGps'));
      return;
    }

    if (!place) {
      return;
    }

    if (!isWithinRange(location, place.location, unlockRadius)) {
      Alert.alert(
        t('game.locationRequired'),
        t('game.mustBeWithin', { radius: unlockRadius }),
      );
      return;
    }

    try {
      const response = await submitAnswerMutation.mutateAsync({
        placeId,
        answer: answer.trim(),
        ...buildLocationPayload(location),
      });

      showLocationWarnings(response.data.warnings);

      void AnalyticsEvents.placeAnswered(
        eventId,
        placeId,
        response.data.isCorrect,
      );

      if (response.data.isCorrect) {
        if (response.data.eventCompleted) {
          const durationSec =
            typeof response.data.eventTotalDurationMs === 'number'
              ? Math.round(response.data.eventTotalDurationMs / 1000)
              : undefined;
          void AnalyticsEvents.huntCompleted(eventId, {
            score: response.data.totalScore ?? response.data.points,
            duration_sec: durationSec,
          });
          completingRef.current = true;
        }

        Alert.alert(
          t('game.correct'),
          response.data.explanation ||
            response.data.message ||
            t('game.greatJob'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                if (response.data.eventCompleted) {
                  navigation.navigate('EventCompletion', {
                    eventId,
                    score: response.data.totalScore ?? response.data.points,
                    totalDurationMs: response.data.eventTotalDurationMs,
                    finishRank: response.data.finishRank,
                    completionMessage: response.data.completionMessage,
                    giftTeaser: response.data.giftTeaser,
                    giftCode: response.data.giftCode,
                    giftCount: response.data.giftCount,
                    giftsAllClaimed: response.data.giftsAllClaimed,
                  });
                } else if (response.data.nextPlaceId) {
                  navigation.replace('PlaceGame', {
                    eventId,
                    placeId: response.data.nextPlaceId,
                  });
                } else {
                  navigation.goBack();
                }
              },
            },
          ],
        );
      } else {
        setHadIncorrectAttempt(true);
        showIncorrectAlert(response.data.message || t('game.tryAgain'));
      }
    } catch (error: any) {
      analytics.recordError(error);
      Alert.alert(t('common.error'), error.message || t('game.submitFailed'));
    }
  };

  if (eventLoading || !event || !place) {
    return <LoadingSpinner fullScreen />;
  }

  if (place.isCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>✅</Text>
          <Text style={styles.completedText}>{t('game.placeCompleted')}</Text>
          <Text style={styles.completedSubtext}>
            {t('game.alreadyCompleted')}
          </Text>
          <Button
            title={t('game.goBack')}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const mapZoom = zoomFromLatitudeDelta(0.01);
  const radiusGeoJson = {
    type: 'Feature' as const,
    properties: {},
    geometry: circlePolygon(
      place.location.latitude,
      place.location.longitude,
      unlockRadius,
    ),
  };

  const question = questionData?.data;
  const canSubmitAnswer =
    isUnlocked && isWithinAnswerRange && hasGoodGpsAccuracy && !!question;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mapContainer}>
          <Mapbox.MapView
            style={styles.map}
            styleURL={MAPBOX_STYLE}
            compassEnabled={false}
            scaleBarEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}>
            <Mapbox.Camera
              centerCoordinate={[
                place.location.longitude,
                place.location.latitude,
              ]}
              zoomLevel={mapZoom}
              animationMode="none"
            />
            <Mapbox.UserLocation visible />
            <Mapbox.ShapeSource id="unlock-radius" shape={radiusGeoJson}>
              <Mapbox.FillLayer
                id="unlock-radius-fill"
                style={{
                  fillColor: colors.primary,
                  fillOpacity: 0.12,
                }}
              />
              <Mapbox.LineLayer
                id="unlock-radius-stroke"
                style={{
                  lineColor: colors.primary,
                  lineWidth: 2,
                }}
              />
            </Mapbox.ShapeSource>
            <Mapbox.PointAnnotation
              id={`place-${place.id}`}
              coordinate={[place.location.longitude, place.location.latitude]}
              title={place.name}>
              <MapPin
                color={isUnlocked ? colors.primary : colors.notStarted}
              />
            </Mapbox.PointAnnotation>
          </Mapbox.MapView>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.placeName}>{place.name}</Text>
            {place.description?.trim() ? (
              <Text style={styles.placeDescription}>{place.description}</Text>
            ) : null}
          </View>

          {locationError ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {(locationError as Error)?.message ||
                  t('game.locationUnavailable')}
              </Text>
            </View>
          ) : null}

          {distance !== null && (
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceText}>
                {t('game.distanceAway', { distance: formatDistance(distance) })}
              </Text>
              {!isUnlocked && (
                <Text style={styles.unlockHint}>
                  {t('game.getWithinToUnlock', { radius: unlockRadius })}
                  {location?.accuracy &&
                  location.accuracy > LOCATION_ACCURACY_THRESHOLD
                    ? t('game.waitingGps')
                    : ''}
                </Text>
              )}
              {isUnlocked && !isWithinAnswerRange && (
                <Text style={styles.unlockHint}>
                  {t('game.mustBeWithin', { radius: unlockRadius })}
                </Text>
              )}
              {isUnlocked && isWithinAnswerRange && !hasGoodGpsAccuracy && (
                <Text style={styles.unlockHint}>{t('game.waitingGps')}</Text>
              )}
            </View>
          )}

          {isUnlocked ? (
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>{t('game.question')}</Text>
              {questionLoading ? (
                <LoadingSpinner />
              ) : question ? (
                <>
                  {question.answerUpdatedAt ? (
                    <View style={styles.updatedBanner}>
                      <Text style={styles.updatedBannerText}>
                        {t('game.answerUpdated')}
                      </Text>
                    </View>
                  ) : null}
                  {hadIncorrectAttempt && place.hint ? (
                    <View style={styles.hintBanner}>
                      <Text style={styles.hintBannerLabel}>
                        {t('game.hintLabel')}
                      </Text>
                      <Text style={styles.hintBannerText}>{place.hint}</Text>
                    </View>
                  ) : null}
                  <QuestionRenderer
                    question={question}
                    answer={answer}
                    onChangeAnswer={setAnswer}
                  />
                  {hadIncorrectAttempt ? (
                    <Button
                      title={t('game.reportProblem')}
                      onPress={() => {
                        void handleReportWrongAnswer();
                      }}
                      variant="outline"
                      fullWidth
                      style={styles.reportButton}
                    />
                  ) : null}
                </>
              ) : (
                <ErrorView message={t('game.couldNotLoadQuestion')} />
              )}

              <Button
                title={t('game.submitAnswer')}
                onPress={handleSubmitAnswer}
                loading={submitAnswerMutation.isPending}
                fullWidth
                style={styles.submitButton}
                disabled={!canSubmitAnswer || !answer.trim()}
              />
            </View>
          ) : (
            <View style={styles.lockedContainer}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedText}>{t('game.placeLocked')}</Text>
              <Text style={styles.lockedSubtext}>
                {!isAccessible
                  ? t('game.completePreviousFirst')
                  : t('game.moveWithinToUnlock', { radius: unlockRadius })}
              </Text>
              <Button
                title={t('game.tryUnlockNow')}
                onPress={attemptUnlock}
                loading={unlockPlaceMutation.isPending}
                style={styles.unlockButton}
              />
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  placeName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  placeDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: colors.warningLight ?? colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  distanceContainer: {
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  distanceText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  unlockHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  questionContainer: {
    marginTop: spacing.md,
  },
  questionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  reportButton: {
    marginBottom: spacing.sm,
  },
  updatedBanner: {
    backgroundColor: colors.infoLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  updatedBannerText: {
    fontSize: fontSize.sm,
    color: colors.info,
    fontWeight: fontWeight.medium,
  },
  hintBanner: {
    backgroundColor: colors.warningLight ?? colors.infoLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  hintBannerLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hintBannerText: {
    fontSize: fontSize.sm,
    color: colors.textDark,
    lineHeight: 20,
  },
  lockedContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  lockedText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  lockedSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  unlockButton: {
    marginTop: spacing.sm,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completedIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  completedText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  completedSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
