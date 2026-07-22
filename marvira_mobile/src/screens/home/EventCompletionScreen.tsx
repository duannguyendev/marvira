import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {useQuery} from '@tanstack/react-query';
import Clipboard from '@react-native-clipboard/clipboard';
import {useEventDetails} from '../../hooks/useEvents';
import {eventsApi} from '../../api/events';
import {Button} from '../../components/Button';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../../theme';
import {formatDuration} from '../../utils/formatDuration';
import {HomeStackParamList} from '../../navigation/types';

const {height} = Dimensions.get('window');

type EventCompletionScreenRouteProp = RouteProp<
  HomeStackParamList,
  'EventCompletion'
>;

type EventCompletionScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'EventCompletion'
>;

export const EventCompletionScreen: React.FC = () => {
  const {t} = useTranslation();
  const route = useRoute<EventCompletionScreenRouteProp>();
  const navigation = useNavigation<EventCompletionScreenNavigationProp>();
  const {
    eventId,
    score: scoreParam,
    totalDurationMs: durationParam,
    finishRank: rankParam,
    completionMessage: messageParam,
    giftTeaser: teaserParam,
    giftCode: codeParam,
    giftCount: countParam,
    giftsAllClaimed: claimedParam,
  } = route.params;

  const {data, isLoading} = useEventDetails(eventId);
  const needsFetch =
    rankParam === undefined &&
    messageParam === undefined &&
    codeParam === undefined;

  const completionQuery = useQuery({
    queryKey: ['eventCompletion', eventId],
    queryFn: () => eventsApi.getEventCompletion(eventId),
    enabled: needsFetch,
  });

  const completion = completionQuery.data?.data;
  const score = scoreParam ?? completion?.score;
  const totalDurationMs = durationParam ?? completion?.totalDurationMs;
  const finishRank = rankParam ?? completion?.finishRank ?? null;
  const completionMessage =
    messageParam ?? completion?.completionMessage ?? null;
  const giftTeaser = teaserParam ?? completion?.giftTeaser ?? null;
  const giftCode = codeParam ?? completion?.giftCode ?? null;
  const giftCount = countParam ?? completion?.giftCount ?? 0;
  const giftsAllClaimed =
    claimedParam ?? completion?.giftsAllClaimed ?? false;

  const [copied, setCopied] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, confettiAnim]);

  const event = data?.data;

  if (isLoading || !event || (needsFetch && completionQuery.isLoading)) {
    return <LoadingSpinner fullScreen />;
  }

  const handleCopyCode = () => {
    if (!giftCode) return;
    try {
      Clipboard.setString(giftCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert(t('common.error'), t('completion.copyFailed'));
    }
  };

  const showGiftBlock = giftCount > 0;

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <Animated.Text
            style={[
              styles.celebrationIcon,
              {
                transform: [
                  {
                    rotate: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}>
            🎉
          </Animated.Text>

          <Text style={styles.title}>{t('completion.congratulations')}</Text>
          <Text style={styles.subtitle}>{t('completion.youCompleted')}</Text>
          <Text style={styles.eventName}>{event.title}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{event.totalPlaces}</Text>
              <Text style={styles.statLabel}>{t('completion.placesVisited')}</Text>
            </View>
            {totalDurationMs != null ? (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDuration(totalDurationMs)}
                </Text>
                <Text style={styles.statLabel}>{t('completion.totalTime')}</Text>
              </View>
            ) : (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>100%</Text>
                <Text style={styles.statLabel}>{t('completion.completion')}</Text>
              </View>
            )}
            {score != null ? (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>{t('completion.points')}</Text>
              </View>
            ) : null}
          </View>

          {completionMessage ? (
            <View style={styles.messageBlock}>
              <Text style={styles.messageLabel}>
                {t('completion.fromCreator')}
              </Text>
              <Text style={styles.messageText}>{completionMessage}</Text>
            </View>
          ) : null}

          {showGiftBlock ? (
            <View style={styles.giftBlock}>
              {giftCode ? (
                <>
                  <Text style={styles.giftTitle}>
                    {t('completion.finisherRank', {rank: finishRank})}
                  </Text>
                  {giftTeaser ? (
                    <Text style={styles.giftTeaser}>
                      {t('completion.yourGift', {teaser: giftTeaser})}
                    </Text>
                  ) : null}
                  <Text style={styles.giftCodeLabel}>
                    {t('completion.giftCode')}
                  </Text>
                  <Text style={styles.giftCode} selectable>
                    {giftCode}
                  </Text>
                  <Button
                    title={
                      copied
                        ? t('completion.codeCopied')
                        : t('completion.copyCode')
                    }
                    onPress={handleCopyCode}
                    fullWidth
                    style={styles.giftButton}
                  />
                </>
              ) : giftsAllClaimed || (finishRank != null && finishRank > giftCount) ? (
                <>
                  <Text style={styles.giftTitle}>
                    {t('completion.giftsWentToFirst', {count: giftCount})}
                  </Text>
                  <Text style={styles.giftTeaser}>
                    {t('completion.youFinishedRank', {rank: finishRank})}
                  </Text>
                  <Button
                    title={t('completion.exploreMore')}
                    onPress={() => navigation.navigate('EventsList')}
                    variant="outline"
                    fullWidth
                    style={styles.giftButton}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title={t('completion.viewLeaderboard')}
              onPress={() =>
                navigation.navigate('EventLeaderboard', {eventId})
              }
              variant="outline"
              fullWidth
              style={styles.button}
            />
            <Button
              title={t('completion.backToEvents')}
              onPress={() => navigation.navigate('EventsList')}
              variant="secondary"
              fullWidth
              style={styles.button}
            />
            <Button
              title={t('completion.viewEventDetails')}
              onPress={() => navigation.navigate('EventDetails', {eventId})}
              variant="outline"
              fullWidth
              style={styles.button}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {[...Array(20)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              left: `${(i * 5) % 100}%`,
              top: -20,
              opacity: confettiAnim,
              transform: [
                {
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height + 100],
                  }),
                },
                {
                  rotate: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${360 * (i % 2 === 0 ? 1 : -1)}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  celebrationIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  eventName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  messageBlock: {
    width: '100%',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  messageLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textDark,
    lineHeight: 22,
  },
  giftBlock: {
    width: '100%',
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  giftTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  giftTeaser: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  giftCodeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  giftCode: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  giftButton: {
    marginBottom: 0,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    marginBottom: 0,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
});
