import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary:', error, info.componentStack);
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { analytics } = require('../services/analytics') as typeof import('../services/analytics');
      analytics.logBreadcrumb(`ErrorBoundary: ${info.componentStack ?? ''}`);
      analytics.recordError(error);
    } catch {
      // ignore
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('errorBoundary.title')}</Text>
          <Text style={styles.message}>
            {this.state.message || i18n.t('errorBoundary.message')}
          </Text>
          <Button
            title={i18n.t('errorBoundary.tryAgain')}
            onPress={this.handleReset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundLight,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
