import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {useEventDetails} from '../../hooks/useEvents';
import {useUpdateEventGifts} from '../../hooks/useMyEvents';
import {eventsApi} from '../../api/events';
import {HomeStackParamList} from '../../navigation/types';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../../theme';

type Route = RouteProp<HomeStackParamList, 'EditEventGifts'>;
type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditEventGifts'>;

const MAX_CODES = 10;

export const EditEventGiftsScreen: React.FC = () => {
  const {t} = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {eventId} = route.params;

  const {data, isLoading, error, refetch} = useEventDetails(eventId);
  const finishersQuery = useQuery({
    queryKey: ['eventFinishers', eventId],
    queryFn: () => eventsApi.getEventFinishers(eventId),
  });
  const updateGifts = useUpdateEventGifts();

  const [giftTeaser, setGiftTeaser] = useState('');
  const [completionMessage, setCompletionMessage] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [giftError, setGiftError] = useState<string | undefined>();
  const initialized = useRef(false);

  const event = data?.data;
  const awardedCount = finishersQuery.data?.data.giftAssignedCount ?? 0;

  useEffect(() => {
    if (!event || initialized.current) return;
    // Wait for finishers so freeze count is known when possible; still init if finishers fail
    if (finishersQuery.isLoading) return;
    initialized.current = true;
    setGiftTeaser(event.giftTeaser ?? '');
    setCompletionMessage(event.completionMessage ?? '');
    setCodes([...(event.giftCodes ?? [])]);
  }, [event, finishersQuery.isLoading]);

  const validate = (): boolean => {
    const trimmed = codes.map(c => c.trim()).filter(Boolean);
    if (trimmed.length > MAX_CODES) {
      setGiftError(t('createEvent.gifts.validation.maxCodes'));
      return false;
    }
    if (trimmed.length > 0 && !giftTeaser.trim()) {
      setGiftError(t('createEvent.gifts.validation.teaserRequired'));
      return false;
    }
    const unique = new Set(trimmed.map(c => c.toLowerCase()));
    if (unique.size !== trimmed.length) {
      setGiftError(t('createEvent.gifts.validation.unique'));
      return false;
    }
    // Frozen prefix must match original (server also enforces append-only)
    const original = event?.giftCodes ?? [];
    if (trimmed.length < original.length) {
      setGiftError(t('createEvent.gifts.validation.appendOnly'));
      return false;
    }
    for (let i = 0; i < original.length; i++) {
      if (trimmed[i] !== original[i]) {
        setGiftError(t('createEvent.gifts.validation.appendOnly'));
        return false;
      }
    }
    setGiftError(undefined);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const trimmed = codes.map(c => c.trim()).filter(Boolean);
    try {
      await updateGifts.mutateAsync({
        eventId,
        giftTeaser: giftTeaser.trim() || null,
        completionMessage: completionMessage.trim() || null,
        giftCodes: trimmed,
      });
      Alert.alert(t('common.ok'), t('createEvent.gifts.saved'), [
        {text: t('common.ok'), onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err?.response?.data?.message ||
          err.message ||
          t('createEvent.gifts.saveFailed'),
      );
    }
  };

  const setCodeAt = (index: number, value: string) => {
    if (index < awardedCount) return;
    setCodes(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addCode = () => {
    if (codes.length >= MAX_CODES) return;
    setCodes(prev => [...prev, '']);
  };

  if (isLoading || finishersQuery.isLoading) {
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{t('createEvent.gifts.heading')}</Text>
      <Text style={styles.subheading}>{t('createEvent.gifts.editSubheading')}</Text>

      {awardedCount > 0 ? (
        <Text style={styles.freezeHint}>
          {t('createEvent.gifts.freezeHint', {count: awardedCount})}
        </Text>
      ) : null}

      <Input
        label={t('createEvent.gifts.teaserLabel')}
        value={giftTeaser}
        onChangeText={setGiftTeaser}
        placeholder={t('createEvent.gifts.teaserPlaceholder')}
        maxLength={80}
      />
      <Input
        label={t('createEvent.gifts.messageLabel')}
        value={completionMessage}
        onChangeText={setCompletionMessage}
        placeholder={t('createEvent.gifts.messagePlaceholder')}
        multiline
      />

      <Text style={styles.codesLabel}>{t('createEvent.gifts.codesLabel')}</Text>
      {codes.map((code, index) => {
        const frozen = index < awardedCount;
        return (
          <View key={`code-${index}`} style={styles.codeRow}>
            <Text style={styles.codeIndex}>#{index + 1}</Text>
            <View style={styles.codeInput}>
              <Input
                value={code}
                onChangeText={v => setCodeAt(index, v)}
                placeholder={t('createEvent.gifts.codePlaceholder', {
                  n: index + 1,
                })}
                editable={!frozen}
                error={undefined}
              />
            </View>
            {frozen ? (
              <Text style={styles.frozenBadge}>
                {t('createEvent.gifts.awarded')}
              </Text>
            ) : null}
          </View>
        );
      })}

      {codes.length < MAX_CODES ? (
        <TouchableOpacity onPress={addCode} style={styles.addLink}>
          <Text style={styles.addLinkText}>
            {t('createEvent.gifts.addCode')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {giftError ? <Text style={styles.error}>{giftError}</Text> : null}

      <Text style={styles.helper}>{t('createEvent.gifts.helper')}</Text>

      <Button
        title={t('createEvent.gifts.save')}
        onPress={handleSave}
        loading={updateGifts.isPending}
        fullWidth
        style={styles.saveButton}
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
    marginBottom: spacing.md,
  },
  freezeHint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  codesLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  codeIndex: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    width: 28,
  },
  codeInput: {
    flex: 1,
  },
  frozenBadge: {
    marginTop: spacing.md,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  addLink: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  addLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  helper: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
