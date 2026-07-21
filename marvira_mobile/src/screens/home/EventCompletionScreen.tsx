import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {useEventDetails} from '../../hooks/useEvents';
import {Button} from '../../components/Button';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../../theme';
import {formatDuration} from '../../utils/formatDuration';
import {HomeStackParamList} from '../../navigation/types';

const {width, height} = Dimensions.get('window');

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
  const {eventId, score, totalDurationMs} = route.params;

  const {data, isLoading} = useEventDetails(eventId);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebration animation
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
  }, []);

  const event = data?.data;

  if (isLoading || !event) {
    return <LoadingSpinner fullScreen />;
  }

  const handleGoHome = () => {
    navigation.navigate('EventsList');
  };

  const handleViewEvent = () => {
    navigation.navigate('EventDetails', {eventId});
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}>
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
              <Text style={styles.statValue}>{formatDuration(totalDurationMs)}</Text>
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
            onPress={handleGoHome}
            variant="secondary"
            fullWidth
            style={styles.button}
          />
          <Button
            title={t('completion.viewEventDetails')}
            onPress={handleViewEvent}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
      </Animated.View>

      {/* Confetti effect */}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
    marginBottom: spacing.xl,
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

