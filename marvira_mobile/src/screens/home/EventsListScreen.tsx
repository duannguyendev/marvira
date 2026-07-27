import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvents } from '../../hooks/useEvents';
import { useLocation } from '../../hooks/useLocation';
import { EventCard } from '../../components/EventCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { EventFilters, EventStatus } from '../../types';
import { calculateDistance } from '../../utils/distance';

type EventsListScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'EventsList'
>;

export const EventsListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EventsListScreenNavigationProp>();
  const { location, hasPermission, requestPermission } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5000);
  const [statusFilter, setStatusFilter] = useState<EventStatus | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const filters: EventFilters = {
    radius,
    status: statusFilter,
    searchQuery: searchQuery.trim() || undefined,
  };

  const { data, isLoading, error, refetch } = useEvents(
    filters,
    location || undefined,
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const events = data?.data || [];
  const eventsWithDistance = location
    ? events.map(event => ({
        ...event,
        distance: calculateDistance(location, event.location),
      }))
    : events;

  const sortedEvents = [...eventsWithDistance].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorView
        message={(error as any).message || t('events.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
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
            {t('common.radius')}: {radius / 1000}
            {t('common.km')}
          </Text>
          <View style={styles.radiusButtons}>
            {[1, 5, 10, 25].map(km => (
              <TouchableOpacity
                key={km}
                style={[
                  styles.radiusButton,
                  radius === km * 1000 && styles.radiusButtonActive,
                ]}
                onPress={() => setRadius(km * 1000)}>
                <Text
                  style={[
                    styles.radiusButtonText,
                    radius === km * 1000 && styles.radiusButtonTextActive,
                  ]}>
                  {km}
                  {t('common.km')}
                </Text>
              </TouchableOpacity>
            ))}
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
            {(['not_started', 'in_progress', 'completed'] as EventStatus[]).map(
              status => (
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
              ),
            )}
          </View>
        </View>
      </View>

      <FlatList
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
            <Text style={styles.emptySubtext}>{t('events.adjustFilters')}</Text>
            <Text style={styles.emptySubtext}>
              {t('events.emptyLanguageHint')}
            </Text>
          </View>
        }
      />
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
  radiusButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  radiusButtonTextActive: {
    color: colors.background,
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
