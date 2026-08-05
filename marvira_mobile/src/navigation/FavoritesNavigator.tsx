import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { QuestionTrainingScreen } from '../screens/practice/QuestionTrainingScreen';
import { FavoritesStackParamList } from './types';
import { primaryStackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export const FavoritesNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={primaryStackScreenOptions}>
      <Stack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{ title: t('nav.favorites') }}
      />
      <Stack.Screen
        name="QuestionTraining"
        component={QuestionTrainingScreen}
        options={{ title: t('nav.questionTraining') }}
      />
    </Stack.Navigator>
  );
};
