import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useMyEvents} from '../../hooks/useMyEvents';
import {MyEventCard} from '../../components/MyEventCard';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {Button} from '../../components/Button';
import {
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '../../theme';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'MyEvents'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Profile'>,
    NativeStackNavigationProp<HomeStackParamList>
  >
>;

export const MyEventsScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {data, isLoading, error, refetch, isRefetching} = useMyEvents();
  const [refreshing, setRefreshing] = useState(false);

  const events = data?.data ?? [];

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
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing || isRefetching} onRefresh={handleRefresh} />
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('myEvents.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('myEvents.emptyMessage')}</Text>
            <Button
              title={t('myEvents.createFirst')}
              onPress={handleCreate}
              fullWidth
              style={styles.createButton}
            />
          </View>
        }
        renderItem={({item}) => (
          <MyEventCard
            event={item}
            onPress={() =>
              navigation.navigate('Home', {
                screen: 'EventDetails',
                params: {eventId: item.id},
              } as MainTabParamList['Home'])
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
