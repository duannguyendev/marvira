import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useEventDetails, useJoinEvent } from '../../hooks/useEvents';
import { useLocation } from '../../hooks/useLocation';
import { useIsEventFavorite } from '../../hooks/useFavorites';
import { useFavoriteEventToggle } from '../../hooks/useFavoriteEventToggle';
import { PlaceCard } from '../../components/PlaceCard';
import { Button } from '../../components/Button';
import { FavoriteButton } from '../../components/FavoriteButton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { UnfavoriteConfirmBottomSheet } from '../../components/UnfavoriteConfirmBottomSheet';
import { JoinEventPasswordSheet } from '../../components/JoinEventPasswordSheet';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { calculateDistance } from '../../utils/distance';
import { DEFAULT_MAP_REGION } from '../../utils/constants';
import { AnalyticsEvents } from '../../services/analytics';
import { buildInviteWebUrl } from '../../utils/inviteLinks';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.4;

type EventDetailsScreenRouteProp = RouteProp<
  HomeStackParamList,
  'EventDetails'
>;

type EventDetailsScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'EventDetails'
>;

export const EventDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<EventDetailsScreenRouteProp>();
  const navigation = useNavigation<EventDetailsScreenNavigationProp>();
  const { eventId } = route.params;

  const { data, isLoading, error, refetch } = useEventDetails(eventId);
  const joinEvent = useJoinEvent();
  const { location } = useLocation();
  const { data: isFavorite } = useIsEventFavorite(eventId);
  const {
    pendingUnfavoriteId,
    onFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useFavoriteEventToggle();

  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const favorited = isFavorite ?? false;

  const event = data?.data;
  const isLocked = !!event?.isPasswordProtected && event.hasAccess === false;
  const eventTitle = event?.title;

  const handleShare = useCallback(async () => {
    if (!eventTitle) {
      return;
    }
    try {
      void AnalyticsEvents.shareTapped(eventId, 'event_detail');
      await Share.share({
        message: t('events.shareMessage', {
          title: eventTitle,
          url: buildInviteWebUrl(eventId),
        }),
      });
    } catch {
      // user dismissed share sheet
    }
  }, [eventId, eventTitle, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            accessibilityLabel={t('events.shareA11y')}
            accessibilityState={{ disabled: !eventTitle }}
            disabled={!eventTitle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.shareButtonText}>↗</Text>
          </TouchableOpacity>
          <FavoriteButton
            isFavorite={favorited}
            onPress={() => onFavoritePress(eventId, favorited)}
            accessibilityLabel={
              favorited
                ? t('favorites.unfavoriteEventA11y')
                : t('favorites.favoriteEventA11y')
            }
          />
        </View>
      ),
    });
  }, [
    navigation,
    eventId,
    favorited,
    onFavoritePress,
    t,
    handleShare,
    eventTitle,
  ]);

  useEffect(() => {
    if (event?.places) {
      const activePlace = event.places.find(
        p => p.isAccessible && !p.isCompleted,
      );
      setActivePlaceId(activePlace?.id ?? null);
    }
  }, [event]);

  const handlePlacePress = (placeId: string) => {
    if (isLocked) {
      setShowJoinSheet(true);
      return;
    }
    if (event) {
      const place = event.places.find(p => p.id === placeId);
      if (place && !place.isCompleted) {
        navigation.navigate('PlaceGame', { eventId, placeId });
      }
    }
  };

  const handleJoinSubmit = async (password: string) => {
    setJoinError(undefined);
    try {
      await joinEvent.mutateAsync({ eventId, password });
      setShowJoinSheet(false);
      await refetch();
    } catch (err: any) {
      setJoinError(
        err?.response?.data?.message ||
          err.message ||
          t('events.join.incorrectPassword'),
      );
    }
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

  const mapRegion =
    event.places.length > 0
      ? {
          latitude: event.places[0].location.latitude,
          longitude: event.places[0].location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : DEFAULT_MAP_REGION;

  const placesWithDistance = location
    ? event.places.map(place => ({
        ...place,
        distance: calculateDistance(location, place.location),
      }))
    : event.places;

  return (
    <>
      <ScrollView style={styles.container}>
        {!isLocked ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation
              showsMyLocationButton>
              {event.places.map(place => (
                <Marker
                  key={place.id}
                  coordinate={place.location}
                  title={place.name}
                  pinColor={
                    place.isCompleted
                      ? colors.completed
                      : place.isUnlocked
                        ? colors.primary
                        : colors.notStarted
                  }
                />
              ))}
            </MapView>
          </View>
        ) : null}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{event.title}</Text>
              {event.isPasswordProtected ? (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>
                    🔒 {t('events.passwordProtected.badge')}
                  </Text>
                </View>
              ) : null}
            </View>
            {event.city ? <Text style={styles.city}>{event.city}</Text> : null}
            {!isLocked ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${event.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {t('events.progressComplete', {
                    progress: event.progress,
                    completed: event.completedPlaces,
                    total: event.totalPlaces,
                  })}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeCountText}>
                {t('events.placesCount', { count: event.totalPlaces })}
              </Text>
            )}
          </View>

          <Text style={styles.description}>{event.description}</Text>

          {event.hasGift ? (
            <View style={styles.giftTeaserCard}>
              <Text style={styles.giftTeaserTitle}>
                🎁 {event.giftTeaser || t('events.giftLabel')}
              </Text>
              <Text style={styles.giftTeaserText}>
                {t('events.giftsForFirst', { count: event.giftCount ?? 0 })}
              </Text>
            </View>
          ) : null}

          {isLocked ? (
            <View style={styles.lockedCard}>
              <Text style={styles.lockedTitle}>
                {t('events.passwordProtected.title')}
              </Text>
              <Text style={styles.lockedMessage}>
                {t('events.passwordProtected.message')}
              </Text>
              <Button
                title={t('events.join.submit')}
                onPress={() => setShowJoinSheet(true)}
                fullWidth
              />
            </View>
          ) : (
            <>
              <Text style={styles.hint}>{t('events.visitHint')}</Text>

              <View style={styles.leaderboardSection}>
                {event.status === 'completed' ? (
                  <Button
                    title={
                      event.hasGift
                        ? t('events.viewYourGift')
                        : t('events.viewCompletion')
                    }
                    onPress={() =>
                      navigation.navigate('EventCompletion', { eventId })
                    }
                    fullWidth
                    style={styles.detailButton}
                  />
                ) : null}
                <Button
                  title={t('events.viewLeaderboard')}
                  onPress={() =>
                    navigation.navigate('EventLeaderboard', { eventId })
                  }
                  variant="outline"
                  fullWidth
                />
              </View>

              <View style={styles.placesSection}>
                <Text style={styles.sectionTitle}>
                  {t('events.placesCount', { count: event.places.length })}
                </Text>
                {placesWithDistance.map(place => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isActive={place.id === activePlaceId}
                    onPress={() => handlePlacePress(place.id)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <JoinEventPasswordSheet
        visible={showJoinSheet}
        loading={joinEvent.isPending}
        error={joinError}
        onClose={() => {
          setShowJoinSheet(false);
          setJoinError(undefined);
        }}
        onSubmit={handleJoinSubmit}
      />

      <UnfavoriteConfirmBottomSheet
        visible={pendingUnfavoriteId !== null}
        title={t('favorites.unfavoriteEventTitle')}
        message={t('favorites.unfavoriteEventMessage')}
        onCancel={cancelUnfavorite}
        onConfirm={confirmUnfavorite}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.xs,
  },
  shareButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  shareButtonText: {
    fontSize: 22,
    color: colors.background,
    fontWeight: fontWeight.bold,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },
  lockBadge: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lockBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textDark,
    fontWeight: fontWeight.semibold,
  },
  city: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  placeCountText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  lockedCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  lockedMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  giftTeaserCard: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  giftTeaserTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  giftTeaserText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  leaderboardSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailButton: {
    marginBottom: spacing.sm,
  },
  placesSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
});
