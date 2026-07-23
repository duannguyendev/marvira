import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGlobalLeaderboard } from '../../hooks/useLeaderboard';
import { useAuth } from '../../hooks/useAuth';
import { LeaderboardList } from '../../components/LeaderboardList';
import { ErrorView } from '../../components/ErrorView';
import { colors, spacing, fontSize, fontWeight } from '../../theme';

export const GlobalLeaderboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, isFetching, error, refetch } =
    useGlobalLeaderboard();

  if (error && !data) {
    return (
      <ErrorView
        message={(error as Error).message || t('leaderboard.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('leaderboard.globalTitle')}</Text>
        <Text style={styles.subtitle}>{t('leaderboard.topPlayers')}</Text>
        <Text style={styles.hint}>{t('leaderboard.rankedGlobal')}</Text>
      </View>

      <LeaderboardList
        variant="global"
        entries={data?.entries ?? []}
        currentUserId={user?.id}
        isLoading={isLoading}
        isRefetching={isFetching && !isLoading}
        onRefresh={() => refetch()}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
