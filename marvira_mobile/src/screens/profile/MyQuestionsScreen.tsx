import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  useDeletePracticeQuestion,
  useMyQuestions,
} from '../../hooks/usePractice';
import { useFavoriteQuestionToggle } from '../../hooks/useFavoriteQuestionToggle';
import { PracticeQuestionCard } from '../../components/PracticeQuestionCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { Button } from '../../components/Button';
import { UnfavoriteConfirmBottomSheet } from '../../components/UnfavoriteConfirmBottomSheet';
import {
  MainTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../theme';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'MyQuestions'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export const MyQuestionsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useMyQuestions();
  const deleteMutation = useDeletePracticeQuestion();
  const {
    pendingUnfavoriteId,
    onFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useFavoriteQuestionToggle();

  const questions = data?.data ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (questionId: string, questionText: string) => {
    Alert.alert(
      t('myQuestions.deleteTitle'),
      t('myQuestions.deleteMessage', { question: questionText }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('myQuestions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(questionId);
            } catch (err: unknown) {
              Alert.alert(
                t('common.error'),
                (err as Error)?.message || t('myQuestions.deleteFailed'),
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
        message={(error as Error)?.message || t('myQuestions.loadFailed')}
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
            <Text style={styles.heading}>{t('myQuestions.heading')}</Text>
            <Text style={styles.subheading}>{t('myQuestions.subheading')}</Text>
            <Button
              title={t('myQuestions.addQuestion')}
              onPress={() => navigation.navigate('AddQuestion')}
              fullWidth
              style={styles.addButton}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('myQuestions.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('myQuestions.emptyMessage')}
            </Text>
            <Button
              title={t('myQuestions.addFirst')}
              onPress={() => navigation.navigate('AddQuestion')}
              fullWidth
              style={styles.addButton}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <PracticeQuestionCard
              question={item}
              onPress={() => {
                if (item.source === 'community') {
                  navigation.navigate('Practice', {
                    screen: 'QuestionTraining',
                    params: { questionId: item.id },
                  });
                }
              }}
              onFavoritePress={() => onFavoritePress(item.id, item.isFavorite)}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  navigation.navigate('AddQuestion', { questionId: item.id })
                }>
                <Text style={styles.actionText}>{t('myQuestions.edit')}</Text>
              </TouchableOpacity>
              {item.source === 'community' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id, item.text)}>
                  <Text style={[styles.actionText, styles.deleteText]}>
                    {t('myQuestions.delete')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>
                    {t('myQuestions.fromEvent', {
                      event: item.eventTitle ?? '',
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

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
  addButton: {
    marginTop: spacing.sm,
  },
  itemWrap: {
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    borderColor: colors.errorLight,
  },
  deleteText: {
    color: colors.error,
  },
  eventBadge: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  eventBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
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
    lineHeight: 20,
  },
});
