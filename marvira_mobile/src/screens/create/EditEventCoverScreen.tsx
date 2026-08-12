import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { appAlert } from '../../utils/appAlert';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { EventCoverImageField } from '../../components/EventCoverImageField';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { useEventDetails } from '../../hooks/useEvents';
import { useUpdateEventCover } from '../../hooks/useMyEvents';
import { uploadsApi } from '../../api/uploads';
import { HomeStackParamList } from '../../navigation/types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../theme';

type Route = RouteProp<HomeStackParamList, 'EditEventCover'>;
type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditEventCover'>;

export const EditEventCoverScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { eventId } = route.params;

  const { data, isLoading, error, refetch } = useEventDetails(eventId);
  const updateCover = useUpdateEventCover();

  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const event = data?.data;

  useEffect(() => {
    if (!event || initialized.current) return;
    initialized.current = true;
    setCoverImage(event.imageUrl);
  }, [event]);

  const handleSave = async () => {
    try {
      setSaving(true);
      let nextCover: string | null = null;
      if (coverImage) {
        const uploaded = await uploadsApi.ensureRemoteImageUrl(coverImage);
        if (!uploaded) {
          throw new Error(t('createEvent.imageUploadFailed'));
        }
        nextCover = uploaded;
      }
      await updateCover.mutateAsync({
        eventId,
        coverImage: nextCover,
      });
      appAlert.alert(t('common.ok'), t('createEvent.cover.saved'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      appAlert.alert(
        t('common.error'),
        err?.response?.data?.message ||
          err.message ||
          t('createEvent.cover.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !event) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !event) {
    return (
      <ErrorView
        message={(error as any)?.message || t('events.detailsLoadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{t('createEvent.cover.heading')}</Text>
        <Text style={styles.subheading}>
          {t('createEvent.cover.subheading')}
        </Text>

        <EventCoverImageField
          value={coverImage}
          onChange={setCoverImage}
        />

        <Button
          title={t('createEvent.cover.save')}
          onPress={handleSave}
          loading={saving || updateCover.isPending}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
