import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePracticeQuestions } from '../../hooks/usePractice';
import { useFavoriteQuestionToggle } from '../../hooks/useFavoriteQuestionToggle';
import { PracticeQuestionCard } from '../../components/PracticeQuestionCard';
import { SegmentedControl } from '../../components/SegmentedControl';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { UnfavoriteConfirmBottomSheet } from '../../components/UnfavoriteConfirmBottomSheet';
import { PracticeStackParamList } from '../../navigation/types';
import { PracticeQuestionStatus } from '../../types';
import { AnalyticsEvents } from '../../services/analytics';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../theme';

type NavigationProp = NativeStackNavigationProp<
  PracticeStackParamList,
  'PracticeList'
>;

export const PracticeListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [status, setStatus] = useState<PracticeQuestionStatus>('unfinished');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } =
    usePracticeQuestions(status);
  const {
    pendingUnfavoriteId,
    onFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useFavoriteQuestionToggle();

  const questions = data?.data ?? [];

  useEffect(() => {
    void AnalyticsEvents.practiceOpened('list');
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorView
        message={(error as Error)?.message || t('practice.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={questions}
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
            <Text style={styles.heading}>{t('practice.heading')}</Text>
            <Text style={styles.subheading}>{t('practice.subheading')}</Text>
            <SegmentedControl
              options={[
                { value: 'unfinished', label: t('practice.toPractice') },
                { value: 'completed', label: t('practice.completedTab') },
              ]}
              value={status}
              onChange={setStatus}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              {status === 'unfinished' ? '📚' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {status === 'unfinished'
                ? t('practice.emptyToPracticeTitle')
                : t('practice.emptyCompletedTitle')}
            </Text>
            <Text style={styles.emptyText}>
              {status === 'unfinished'
                ? t('practice.emptyToPracticeMessage')
                : t('practice.emptyCompletedMessage')}
            </Text>
            <Text style={styles.emptyHint}>
              {t('practice.emptyLanguageHint')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PracticeQuestionCard
            question={item}
            onPress={() =>
              navigation.navigate('QuestionTraining', { questionId: item.id })
            }
            onFavoritePress={() => onFavoritePress(item.id, item.isFavorite)}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddQuestion')}
        accessibilityLabel={t('practice.addQuestion')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <UnfavoriteConfirmBottomSheet
        visible={pendingUnfavoriteId !== null}
        title={t('favorites.unfavoriteQuestionTitle')}
        message={t('favorites.unfavoriteQuestionMessage')}
        onCancel={cancelUnfavorite}
        onConfirm={confirmUnfavorite}
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
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.sm,
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
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
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
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.md,
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
