import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvents } from '../../hooks/useEvents';
import { useLocation } from '../../hooks/useLocation';
import { EventCard } from '../../components/EventCard';
import { EventListSkeleton } from '../../components/EventCardSkeleton';
import { ErrorView } from '../../components/ErrorView';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { EventAvailabilityFilter, EventFilters } from '../../types';
import { calculateDistance, hasUsableCoordinates } from '../../utils/distance';
import { notifyDestinationReady } from '../../native/bootSplash';
import {
  DEFAULT_EVENT_LIST_RADIUS_METERS,
  getEventListFilters,
  setEventListFilters,
} from '../../services/eventFiltersStorage';

const SEARCH_DEBOUNCE_MS = 250;
const AVAILABILITY_FILTERS: EventAvailabilityFilter[] = ['open', 'incoming'];

type EventsListScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'EventsList'
>;

export const EventsListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EventsListScreenNavigationProp>();
  const { location, hasPermission, requestPermission, isLoading: isLocationLoading } =
    useLocation();
  const canFilterByRadius = hasPermission || !!location;
  const listRef = useRef<FlatList>(null);
  const filtersHydratedRef = useRef(false);
  const scrollToTopRef = useRef({
    scrollToTop: () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
  });
  useScrollToTop(scrollToTopRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  /** meters; null = no radius filter */
  const [radius, setRadius] = useState<number | null>(
    DEFAULT_EVENT_LIST_RADIUS_METERS,
  );
  const [statusFilter, setStatusFilter] = useState<
    EventAvailabilityFilter | undefined
  >();
  const [filtersReady, setFiltersReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getEventListFilters().then(stored => {
      if (cancelled) {
        return;
      }
      if (stored) {
        setRadius(stored.radius);
        setStatusFilter(stored.status);
      }
      filtersHydratedRef.current = true;
      setFiltersReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!filtersHydratedRef.current) {
      return;
    }
    void setEventListFilters({ radius, status: statusFilter });
  }, [radius, statusFilter]);

  useEffect(() => {
    if (!filtersReady || radius == null) {
      return;
    }
    // Wait until permission check finishes before clearing a saved radius.
    if (canFilterByRadius || isLocationLoading) {
      return;
    }
    setRadius(null);
  }, [filtersReady, canFilterByRadius, isLocationLoading, radius]);

  const handleRadiusKmPress = async (km: number) => {
    if (!canFilterByRadius) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    setRadius(km * 1000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: EventFilters = useMemo(
    () => ({
      radius: radius ?? undefined,
      status: statusFilter,
      searchQuery: debouncedSearchQuery || undefined,
    }),
    [radius, statusFilter, debouncedSearchQuery],
  );

  const { data, isLoading, isFetching, error, refetch } = useEvents(
    filters,
    location || undefined,
    { enabled: filtersReady },
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const events = data?.data;
  // Nearby API already provides distanceMeters. Recalculating from
  // event.location is wrong when the list payload omits places (mapper
  // falls back to 0,0 → ~12,000km from Vietnam).
  const sortedEvents = useMemo(() => {
    const list = events ?? [];
    const eventsWithDistance = location
      ? list.map(event => {
          if (!hasUsableCoordinates(event.location)) {
            return event;
          }
          return {
            ...event,
            distance: calculateDistance(location, event.location),
          };
        })
      : list;

    return [...eventsWithDistance].sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });
  }, [events, location]);

  // Keep the existing FlatList mounted while a filter refetch is in flight.
  // Swapping to a skeleton remounts the list and snaps scroll to top.
  const showResultsSkeleton =
    (!filtersReady || isLoading || (isFetching && !data)) &&
    !refreshing &&
    !events?.length;

  return (
    <View style={styles.container} onLayout={notifyDestinationReady}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('events.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.radiusContainer}>
          <Text style={styles.filterLabel}>
            {t('common.radius')}:{' '}
            {radius == null
              ? t('common.all')
              : `${radius / 1000}${t('common.km')}`}
          </Text>
          <View style={styles.radiusButtons}>
            <TouchableOpacity
              style={[
                styles.radiusButton,
                radius == null && styles.radiusButtonActive,
              ]}
              onPress={() => setRadius(null)}>
              <Text
                style={[
                  styles.radiusButtonText,
                  radius == null && styles.radiusButtonTextActive,
                ]}>
                {t('common.all')}
              </Text>
            </TouchableOpacity>
            {[1, 5, 10, 25].map(km => {
              const isActive = radius === km * 1000;
              const isDisabled = !canFilterByRadius && !isLocationLoading;
              return (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radiusButton,
                    isActive && styles.radiusButtonActive,
                    isDisabled && styles.radiusButtonDisabled,
                  ]}
                  onPress={() => void handleRadiusKmPress(km)}>
                  <Text
                    style={[
                      styles.radiusButtonText,
                      isActive && styles.radiusButtonTextActive,
                      isDisabled && styles.radiusButtonTextDisabled,
                    ]}>
                    {km}
                    {t('common.km')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.filterLabel}>{t('common.status')}:</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                !statusFilter && styles.statusButtonActive,
              ]}
              onPress={() => setStatusFilter(undefined)}>
              <Text
                style={[
                  styles.statusButtonText,
                  !statusFilter && styles.statusButtonTextActive,
                ]}>
                {t('common.all')}
              </Text>
            </TouchableOpacity>
            {AVAILABILITY_FILTERS.map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  statusFilter === status && styles.statusButtonActive,
                ]}
                onPress={() => setStatusFilter(status)}>
                <Text
                  style={[
                    styles.statusButtonText,
                    statusFilter === status && styles.statusButtonTextActive,
                  ]}>
                  {t(`eventStatus.${status}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {error && !showResultsSkeleton ? (
        <ErrorView
          message={(error as any).message || t('events.loadFailed')}
          onRetry={() => refetch()}
        />
      ) : showResultsSkeleton ? (
        <EventListSkeleton />
      ) : (
        <FlatList
          ref={listRef}
          data={sortedEvents}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => {
                if (!item.isIncoming) {
                  handleEventPress(item.id);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('events.noEventsFound')}</Text>
              <Text style={styles.emptySubtext}>
                {t('events.adjustFilters')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('events.emptyLanguageHint')}
              </Text>
            </View>
          }
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEventInfo')}
        accessibilityLabel={t('nav.createEvent')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textDark,
  },
  filtersContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radiusContainer: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  radiusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusButtonDisabled: {
    opacity: 0.45,
  },
  radiusButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  radiusButtonTextActive: {
    color: colors.background,
  },
  radiusButtonTextDisabled: {
    color: colors.textLight,
  },
  statusContainer: {
    marginTop: spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  statusButtonTextActive: {
    color: colors.background,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.background,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
  },
});
