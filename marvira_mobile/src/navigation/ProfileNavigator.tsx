import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {MyEventsScreen} from '../screens/profile/MyEventsScreen';
import {MyQuestionsScreen} from '../screens/profile/MyQuestionsScreen';
import {AddQuestionScreen} from '../screens/practice/AddQuestionScreen';
import {SettingsScreen} from '../screens/settings/SettingsScreen';
import {FeedbackScreen} from '../screens/settings/FeedbackScreen';
import {withScreenSafeArea} from '../components/Screen';
import {ProfileStackParamList} from './types';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();
const ProfileScreenSafe = withScreenSafeArea(ProfileScreen, [
  'top',
  'left',
  'right',
]);
const SettingsScreenSafe = withScreenSafeArea(SettingsScreen, [
  'top',
  'left',
  'right',
]);
const FeedbackScreenSafe = withScreenSafeArea(FeedbackScreen, [
  'top',
  'left',
  'right',
]);

export const ProfileNavigator: React.FC = () => {
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
        name="ProfileMain"
        component={ProfileScreenSafe}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreenSafe}
        options={{title: t('nav.settings')}}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreenSafe}
        options={{title: t('nav.feedback')}}
      />
      <Stack.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{title: t('nav.myEvents')}}
      />
      <Stack.Screen
        name="MyQuestions"
        component={MyQuestionsScreen}
        options={{title: t('nav.myQuestions')}}
      />
      <Stack.Screen
        name="AddQuestion"
        component={AddQuestionScreen}
        options={({route}) => ({
          title: route.params?.questionId
            ? t('practice.editQuestion')
            : t('practice.addQuestion'),
        })}
      />
    </Stack.Navigator>
  );
};
