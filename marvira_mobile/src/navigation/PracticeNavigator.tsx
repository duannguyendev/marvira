import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PracticeListScreen } from '../screens/practice/PracticeListScreen';
import { QuestionTrainingScreen } from '../screens/practice/QuestionTrainingScreen';
import { AddQuestionScreen } from '../screens/practice/AddQuestionScreen';
import { PracticeStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export const PracticeNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: colors.backgroundLight },
      }}>
      <Stack.Screen
        name="PracticeList"
        component={PracticeListScreen}
        options={{ title: t('nav.practice') }}
      />
      <Stack.Screen
        name="QuestionTraining"
        component={QuestionTrainingScreen}
        options={{ title: t('nav.questionTraining') }}
      />
      <Stack.Screen
        name="AddQuestion"
        component={AddQuestionScreen}
        options={({ route }) => ({
          title: route.params?.questionId
            ? t('practice.editQuestion')
            : t('practice.addQuestion'),
        })}
      />
    </Stack.Navigator>
  );
};
