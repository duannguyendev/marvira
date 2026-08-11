import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface ErrorViewProps {
  message: string;
  subtitle?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  subtitle,
  onRetry,
  retryLabel,
  onAction,
  actionLabel,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {onAction && (
        <TouchableOpacity style={styles.retryButton} onPress={onAction}>
          <Text style={styles.retryText}>
            {actionLabel ?? t('game.goBack')}
          </Text>
        </TouchableOpacity>
      )}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>
            {retryLabel ?? t('common.retry')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
