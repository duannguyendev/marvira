import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {FavoritesScreen} from '../screens/favorites/FavoritesScreen';
import {QuestionTrainingScreen} from '../screens/practice/QuestionTrainingScreen';
import {FavoritesStackParamList} from './types';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export const FavoritesNavigator: React.FC = () => {
  const {t} = useTranslation();

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
        contentStyle: {backgroundColor: colors.backgroundLight},
      }}>
      <Stack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{title: t('nav.favorites')}}
      />
      <Stack.Screen
        name="QuestionTraining"
        component={QuestionTrainingScreen}
        options={{title: t('nav.questionTraining')}}
      />
    </Stack.Navigator>
  );
};
