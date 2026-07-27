import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  useMyEvents,
  useCancelSchedule,
  useDeleteEvent,
  useEndEvent,
} from '../../hooks/useMyEvents';
import { MyEventCard } from '../../components/MyEventCard';
import { SegmentedControl } from '../../components/SegmentedControl';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { Button } from '../../components/Button';
import {
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { MyEventLifecycleStatus } from '../../types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../theme';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'MyEvents'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Profile'>,
    NativeStackNavigationProp<HomeStackParamList>
  >
>;

const STATUS_TABS: MyEventLifecycleStatus[] = [
  'draft',
  'scheduled',
  'published',
  'done',
];

export const MyEventsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { data, isLoading, error, refetch, isRefetching } = useMyEvents();
  const cancelSchedule = useCancelSchedule();
  const deleteEvent = useDeleteEvent();
  const endEvent = useEndEvent();
  const [refreshing, setRefreshing] = useState(false);
  const [statusTab, setStatusTab] =
    useState<MyEventLifecycleStatus>('draft');

  const events = data?.data ?? [];

  const counts = useMemo(() => {
    const next: Record<MyEventLifecycleStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      done: 0,
    };
    for (const event of events) {
      next[event.lifecycleStatus] += 1;
    }
    return next;
  }, [events]);

  const filteredEvents = useMemo(
    () => events.filter(event => event.lifecycleStatus === statusTab),
    [events, statusTab],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreate = () => {
    navigation.navigate('Home', {
      screen: 'CreateEventInfo',
    } as MainTabParamList['Home']);
  };

  const handleDelete = (eventId: string, title: string) => {
    Alert.alert(
      t('myEvents.deleteTitle'),
      t('myEvents.deleteMessage', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myEvents.deleteDraft'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent.mutateAsync(eventId);
            } catch (err: unknown) {
              Alert.alert(
                t('common.error'),
                (err as Error)?.message || t('myEvents.deleteFailed'),
              );
            }
          },
        },
      ],
    );
  };

  const handleEnd = (eventId: string, title: string) => {
    Alert.alert(
      t('myEvents.endTitle'),
      t('myEvents.endMessage', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myEvents.endEvent'),
          style: 'destructive',
          onPress: async () => {
            try {
              await endEvent.mutateAsync(eventId);
              setStatusTab('done');
            } catch (err: unknown) {
              Alert.alert(
                t('common.error'),
                (err as Error)?.message || t('myEvents.endFailed'),
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorView
        message={(error as any)?.message || t('myEvents.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{t('myEvents.heading')}</Text>
            <Text style={styles.subheading}>{t('myEvents.subheading')}</Text>
            <Button
              title={t('myEvents.createNew')}
              onPress={handleCreate}
              fullWidth
              style={styles.createButton}
            />
            <SegmentedControl
              options={STATUS_TABS.map(value => ({
                value,
                label: `${t(`myEvents.tabs.${value}`)} (${counts[value]})`,
              }))}
              value={statusTab}
              onChange={setStatusTab}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {t(`myEvents.empty.${statusTab}Title`)}
            </Text>
            <Text style={styles.emptyText}>
              {t(`myEvents.empty.${statusTab}Message`)}
            </Text>
            {statusTab === 'draft' ? (
              <Button
                title={t('myEvents.createFirst')}
                onPress={handleCreate}
                fullWidth
                style={styles.createButton}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <MyEventCard
            event={item}
            onPress={() =>
              navigation.navigate('Home', {
                screen: 'EventDetails',
                params: { eventId: item.id },
              } as MainTabParamList['Home'])
            }
            onEditGiftsPress={() =>
              navigation.navigate('Home', {
                screen: 'EditEventGifts',
                params: { eventId: item.id },
              } as MainTabParamList['Home'])
            }
            onEditAnswersPress={() =>
              navigation.navigate('Home', {
                screen: 'EditEventAnswers',
                params: { eventId: item.id },
              } as MainTabParamList['Home'])
            }
            onContinuePublishPress={
              item.lifecycleStatus === 'draft' ||
              item.lifecycleStatus === 'scheduled'
                ? () =>
                    navigation.navigate('Home', {
                      screen: 'CreateEventReview',
                      params: { eventId: item.id },
                    } as MainTabParamList['Home'])
                : undefined
            }
            onReschedulePress={
              item.lifecycleStatus === 'scheduled'
                ? () =>
                    navigation.navigate('Home', {
                      screen: 'CreateEventReview',
                      params: { eventId: item.id },
                    } as MainTabParamList['Home'])
                : undefined
            }
            onCancelSchedulePress={
              item.lifecycleStatus === 'scheduled'
                ? () => {
                    cancelSchedule.mutate(item.id);
                  }
                : undefined
            }
            onDeletePress={
              item.lifecycleStatus === 'draft' ||
              item.lifecycleStatus === 'scheduled'
                ? () => handleDelete(item.id, item.title)
                : undefined
            }
            onEndPress={
              item.lifecycleStatus === 'published'
                ? () => handleEnd(item.id, item.title)
                : undefined
            }
            onFinishersPress={
              item.lifecycleStatus === 'published' ||
              item.lifecycleStatus === 'done'
                ? () =>
                    navigation.navigate('Home', {
                      screen: 'EventFinishers',
                      params: { eventId: item.id },
                    } as MainTabParamList['Home'])
                : undefined
            }
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
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
  createButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
