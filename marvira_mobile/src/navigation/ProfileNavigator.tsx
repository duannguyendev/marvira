import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyEventsScreen } from '../screens/profile/MyEventsScreen';
import { MyQuestionsScreen } from '../screens/profile/MyQuestionsScreen';
import { AddQuestionScreen } from '../screens/practice/AddQuestionScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { SetPasswordScreen } from '../screens/settings/SetPasswordScreen';
import { FeedbackScreen } from '../screens/settings/FeedbackScreen';
import { NotificationListScreen } from '../screens/notifications/NotificationListScreen';
import { NotificationDetailScreen } from '../screens/notifications/NotificationDetailScreen';
import { withScreenSafeArea } from '../components/Screen';
import { ProfileStackParamList } from './types';
import { primaryStackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator<ProfileStackParamList>();
/** Profile home has no stack header — pad under status bar. */
const ProfileScreenSafe = withScreenSafeArea(ProfileScreen, [
  'top',
  'left',
  'right',
]);
/** Headered screens: only horizontal safe area (header owns the top inset). */
const headeredEdges = ['left', 'right'] as const;
const SettingsScreenSafe = withScreenSafeArea(SettingsScreen, [...headeredEdges]);
const ChangePasswordScreenSafe = withScreenSafeArea(ChangePasswordScreen, [
  ...headeredEdges,
]);
const SetPasswordScreenSafe = withScreenSafeArea(SetPasswordScreen, [
  ...headeredEdges,
]);
const FeedbackScreenSafe = withScreenSafeArea(FeedbackScreen, [...headeredEdges]);
const NotificationListScreenSafe = withScreenSafeArea(NotificationListScreen, [
  ...headeredEdges,
]);
const NotificationDetailScreenSafe = withScreenSafeArea(
  NotificationDetailScreen,
  [...headeredEdges],
);

export const ProfileNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={primaryStackScreenOptions}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreenSafe}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreenSafe}
        options={{ title: t('nav.settings') }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreenSafe}
        options={{ title: t('settings.changePassword') }}
      />
      <Stack.Screen
        name="SetPassword"
        component={SetPasswordScreenSafe}
        options={{ title: t('settings.setPassword') }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreenSafe}
        options={{ title: t('nav.feedback') }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationListScreenSafe}
        options={{ title: t('nav.notifications') }}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreenSafe}
        options={{ title: t('nav.notificationDetail') }}
      />
      <Stack.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{ title: t('nav.myEvents') }}
      />
      <Stack.Screen
        name="MyQuestions"
        component={MyQuestionsScreen}
        options={{ title: t('nav.myQuestions') }}
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
