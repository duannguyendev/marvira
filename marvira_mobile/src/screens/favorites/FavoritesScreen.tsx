import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  useFavoriteEvents,
  useFavoriteQuestions,
} from '../../hooks/useFavorites';
import { useFavoriteQuestionToggle } from '../../hooks/useFavoriteQuestionToggle';
import { useFavoriteEventToggle } from '../../hooks/useFavoriteEventToggle';
import { EventCard } from '../../components/EventCard';
import { PracticeQuestionCard } from '../../components/PracticeQuestionCard';
import { SegmentedControl } from '../../components/SegmentedControl';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { UnfavoriteConfirmBottomSheet } from '../../components/UnfavoriteConfirmBottomSheet';
import {
  FavoritesStackParamList,
  HomeStackParamList,
  MainTabParamList,
} from '../../navigation/types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../theme';

type FavoriteTab = 'events' | 'questions';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<FavoritesStackParamList, 'FavoritesList'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Favorites'>,
    NativeStackNavigationProp<HomeStackParamList>
  >
>;

export const FavoritesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [tab, setTab] = useState<FavoriteTab>('events');
  const [refreshing, setRefreshing] = useState(false);

  const eventsQuery = useFavoriteEvents();
  const questionsQuery = useFavoriteQuestions();
  const eventFavorite = useFavoriteEventToggle();
  const questionFavorite = useFavoriteQuestionToggle();

  const activeQuery = tab === 'events' ? eventsQuery : questionsQuery;

  const handleRefresh = async () => {
    setRefreshing(true);
    await activeQuery.refetch();
    setRefreshing(false);
  };

  if (activeQuery.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (activeQuery.error) {
    return (
      <ErrorView
        message={
          (activeQuery.error as Error)?.message || t('favorites.loadFailed')
        }
        onRetry={() => activeQuery.refetch()}
      />
    );
  }

  const events = eventsQuery.data?.data ?? [];
  const questions = questionsQuery.data?.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('favorites.heading')}</Text>
        <Text style={styles.subheading}>{t('favorites.subheading')}</Text>
        <SegmentedControl
          options={[
            { value: 'events', label: t('favorites.eventsTab') },
            { value: 'questions', label: t('favorites.questionsTab') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || eventsQuery.isRefetching}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={[styles.empty, styles.eventsEmpty]}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>
                {t('favorites.emptyEventsTitle')}
              </Text>
              <Text style={styles.emptyText}>
                {t('favorites.emptyEventsMessage')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              isFavorite
              onFavoritePress={() =>
                eventFavorite.onFavoritePress(item.id, true)
              }
              onPress={() =>
                navigation.navigate('Home', {
                  screen: 'EventDetails',
                  params: { eventId: item.id },
                } as MainTabParamList['Home'])
              }
            />
          )}
        />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.questionsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || questionsQuery.isRefetching}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>
                {t('favorites.emptyQuestionsTitle')}
              </Text>
              <Text style={styles.emptyText}>
                {t('favorites.emptyQuestionsMessage')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PracticeQuestionCard
              question={item}
              onPress={() =>
                navigation.navigate('QuestionTraining', { questionId: item.id })
              }
              onFavoritePress={() =>
                questionFavorite.onFavoritePress(item.id, item.isFavorite)
              }
            />
          )}
        />
      )}

      <UnfavoriteConfirmBottomSheet
        visible={
          tab === 'events'
            ? eventFavorite.pendingUnfavoriteId !== null
            : questionFavorite.pendingUnfavoriteId !== null
        }
        title={
          tab === 'events'
            ? t('favorites.unfavoriteEventTitle')
            : t('favorites.unfavoriteQuestionTitle')
        }
        message={
          tab === 'events'
            ? t('favorites.unfavoriteEventMessage')
            : t('favorites.unfavoriteQuestionMessage')
        }
        onCancel={
          tab === 'events'
            ? eventFavorite.cancelUnfavorite
            : questionFavorite.cancelUnfavorite
        }
        onConfirm={
          tab === 'events'
            ? eventFavorite.confirmUnfavorite
            : questionFavorite.confirmUnfavorite
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    padding: spacing.md,
    paddingBottom: 0,
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
  eventsList: {
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  questionsList: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  eventsEmpty: {
    marginHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
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
    lineHeight: 20,
  },
});
