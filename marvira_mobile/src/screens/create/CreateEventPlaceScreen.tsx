import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StepIndicator} from '../../components/StepIndicator';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {MapPicker, getDefaultCoordinate} from '../../components/MapPicker';
import {QuestionForm} from '../../components/QuestionForm';
import {useCreatePlaceWithQuestion} from '../../hooks/useMyEvents';
import {useLocation} from '../../hooks/useLocation';
import {
  CreatePlaceInput,
  CreateQuestionInput,
  Location,
} from '../../types';
import {HomeStackParamList} from '../../navigation/types';
import {colors, spacing, fontSize, fontWeight} from '../../theme';

type CreateEventPlaceRouteProp = RouteProp<HomeStackParamList, 'CreateEventPlace'>;

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CreateEventPlace'>;

const STEP_LABELS = ['info', 'places', 'review', 'done'];

const DEFAULT_QUESTION: CreateQuestionInput = {
  question: '',
  type: 'TEXT',
  answer: '',
  points: 10,
};

export const CreateEventPlaceScreen: React.FC = () => {
  const {t} = useTranslation();
  const route = useRoute<CreateEventPlaceRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {eventId, placeIndex} = route.params;
  const {location, requestPermission} = useLocation();
  const createPlace = useCreatePlaceWithQuestion();

  const [coordinate, setCoordinate] = useState<Location>(
    getDefaultCoordinate(location),
  );
  const [place, setPlace] = useState<CreatePlaceInput>({
    title: '',
    description: '',
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    radiusMeters: 100,
  });
  const [question, setQuestion] = useState<CreateQuestionInput>(DEFAULT_QUESTION);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCoordinateChange = (next: Location) => {
    setCoordinate(next);
    setPlace(prev => ({
      ...prev,
      latitude: next.latitude,
      longitude: next.longitude,
    }));
  };

  const handleUseMyLocation = async () => {
    const granted = location ? true : await requestPermission();
    if (!granted && !location) {
      Alert.alert(t('game.locationRequired'), t('game.enableGps'));
      return;
    }
    if (location) {
      handleCoordinateChange(location);
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (place.title.trim().length < 2) {
      nextErrors.title = t('createEvent.validation.placeTitleMin');
    }
    if (place.description.trim().length < 5) {
      nextErrors.description = t('createEvent.validation.placeDescriptionMin');
    }
    if (question.question.trim().length < 3) {
      nextErrors.question = t('createEvent.validation.questionMin');
    }
    if (question.type !== 'TRUE_FALSE' && question.answer.trim().length < 1) {
      nextErrors.answer = t('createEvent.validation.answerRequired');
    }
    if (question.type === 'MULTIPLE_CHOICE') {
      const options = (question.options ?? []).map(o => o.trim()).filter(Boolean);
      if (options.length < 2) {
        nextErrors.options = t('createEvent.validation.optionsMin');
      } else if (
        !options.some(
          o => o.toLowerCase() === question.answer.trim().toLowerCase(),
        )
      ) {
        nextErrors.answer = t('createEvent.validation.answerMustMatchOption');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitPlace = async (isLast: boolean) => {
    if (!validate()) {
      return;
    }

    const placePayload: CreatePlaceInput = {
      ...place,
      title: place.title.trim(),
      description: place.description.trim(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };

    const questionPayload: CreateQuestionInput = {
      ...question,
      question: question.question.trim(),
      answer: question.answer.trim(),
      options:
        question.type === 'MULTIPLE_CHOICE'
          ? (question.options ?? []).map(o => o.trim()).filter(Boolean)
          : undefined,
    };

    try {
      await createPlace.mutateAsync({
        eventId,
        orderIndex: placeIndex,
        place: placePayload,
        question: questionPayload,
      });

      if (isLast) {
        navigation.navigate('CreateEventReview', {eventId});
      } else {
        navigation.push('CreateEventPlace', {
          eventId,
          placeIndex: placeIndex + 1,
        });
      }
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error?.response?.data?.message || error.message || t('createEvent.placeFailed'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator
        currentStep={2}
        totalSteps={4}
        labels={STEP_LABELS.map(key => t(`createEvent.steps.${key}`))}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>
          {t('createEvent.placeHeading', {n: placeIndex + 1})}
        </Text>
        <Text style={styles.subheading}>{t('createEvent.placeSubheading')}</Text>

        <MapPicker
          coordinate={coordinate}
          onCoordinateChange={handleCoordinateChange}
          onUseMyLocation={handleUseMyLocation}
        />

        <Input
          label={t('createEvent.placeTitle')}
          value={place.title}
          onChangeText={title => setPlace(prev => ({...prev, title}))}
          placeholder={t('createEvent.placeTitlePlaceholder')}
          error={errors.title}
        />
        <Input
          label={t('createEvent.placeDescription')}
          value={place.description}
          onChangeText={description => setPlace(prev => ({...prev, description}))}
          placeholder={t('createEvent.placeDescriptionPlaceholder')}
          multiline
          error={errors.description}
        />
        <Input
          label={t('createEvent.radiusMeters')}
          value={String(place.radiusMeters)}
          onChangeText={value =>
            setPlace(prev => ({
              ...prev,
              radiusMeters: Math.min(
                5000,
                Math.max(10, parseInt(value || '100', 10) || 100),
              ),
            }))
          }
          keyboardType="number-pad"
        />
        <Input
          label={t('createEvent.hintOptional')}
          value={place.hint ?? ''}
          onChangeText={hint => setPlace(prev => ({...prev, hint: hint || undefined}))}
          placeholder={t('createEvent.hintPlaceholder')}
        />

        <QuestionForm
          value={question}
          onChange={setQuestion}
          errors={{
            question: errors.question,
            answer: errors.answer,
            options: errors.options,
          }}
        />

        <View style={styles.actions}>
          <Button
            title={t('createEvent.addAnotherPlace')}
            onPress={() => submitPlace(false)}
            loading={createPlace.isPending}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title={t('createEvent.lastPlace')}
            onPress={() => submitPlace(true)}
            loading={createPlace.isPending}
            fullWidth
            style={styles.actionButton}
          />
        </View>
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
    marginBottom: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
