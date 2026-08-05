import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import {
  useMarkNotificationRead,
  useNotification,
} from '../../hooks/useNotifications';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/Button';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { AnalyticsEvents } from '../../services/analytics';

type DetailRoute = RouteProp<ProfileStackParamList, 'NotificationDetail'>;
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'NotificationDetail'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<HomeStackParamList>
  >
>;

function dataString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = data[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export const NotificationDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { notificationId } = route.params;
  const { data, isLoading } = useNotification(notificationId);
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (data && !data.readAt) {
      markRead.mutate(notificationId);
    }
    if (data) {
      void AnalyticsEvents.notificationOpened(data.type, data.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading || !data) {
    return <LoadingSpinner fullScreen />;
  }

  const eventId = dataString(data.data, 'eventId');

  const handleOpenRelated = () => {
    if (!eventId) {
      return;
    }
    navigation.navigate('Home', {
      screen: 'EventDetails',
      params: { eventId },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.time}>
          {new Date(data.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.body}>{data.body}</Text>
      </View>
      {eventId ? (
        <Button
          title={t('notifications.openEvent')}
          onPress={handleOpenRelated}
          fullWidth
        />
      ) : null}
      <Button
        title={t('notifications.backToList')}
        onPress={() => navigation.navigate('Notifications')}
        variant="outline"
        fullWidth
        style={styles.backBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  time: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  body: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  backBtn: {
    marginTop: spacing.sm,
  },
});
