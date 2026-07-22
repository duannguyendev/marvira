import React from 'react';
import {TouchableOpacity, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {EventsListScreen} from '../screens/home/EventsListScreen';
import {EventDetailsScreen} from '../screens/home/EventDetailsScreen';
import {PlaceGameScreen} from '../screens/home/PlaceGameScreen';
import {EventCompletionScreen} from '../screens/home/EventCompletionScreen';
import {EventLeaderboardScreen} from '../screens/home/EventLeaderboardScreen';
import {GlobalLeaderboardScreen} from '../screens/home/GlobalLeaderboardScreen';
import {CreateEventInfoScreen} from '../screens/create/CreateEventInfoScreen';
import {CreateEventPlaceScreen} from '../screens/create/CreateEventPlaceScreen';
import {CreateEventReviewScreen} from '../screens/create/CreateEventReviewScreen';
import {CreateEventSuccessScreen} from '../screens/create/CreateEventSuccessScreen';
import {EditEventGiftsScreen} from '../screens/create/EditEventGiftsScreen';
import {EventFinishersScreen} from '../screens/home/EventFinishersScreen';
import {withScreenSafeArea} from '../components/Screen';
import {HomeStackParamList} from './types';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();
const EventCompletionScreenSafe = withScreenSafeArea(EventCompletionScreen, [
  'top',
  'left',
  'right',
]);

export const HomeNavigator: React.FC = () => {
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
        name="EventsList"
        component={EventsListScreen}
        options={({navigation}) => ({
          title: t('nav.events'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GlobalLeaderboard')}
              style={{marginRight: 12}}
              accessibilityLabel={t('nav.globalLeaderboardA11y')}>
              <Text style={{fontSize: 22}}>🏆</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{title: t('nav.eventDetails')}}
      />
      <Stack.Screen
        name="PlaceGame"
        component={PlaceGameScreen}
        options={{title: t('nav.placeChallenge')}}
      />
      <Stack.Screen
        name="EventCompletion"
        component={EventCompletionScreenSafe}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="EventLeaderboard"
        component={EventLeaderboardScreen}
        options={{title: t('nav.leaderboard')}}
      />
      <Stack.Screen
        name="EventFinishers"
        component={EventFinishersScreen}
        options={{title: t('nav.finishers')}}
      />
      <Stack.Screen
        name="GlobalLeaderboard"
        component={GlobalLeaderboardScreen}
        options={{title: t('nav.globalRankings')}}
      />
      <Stack.Screen
        name="CreateEventInfo"
        component={CreateEventInfoScreen}
        options={{title: t('nav.createEvent')}}
      />
      <Stack.Screen
        name="CreateEventPlace"
        component={CreateEventPlaceScreen}
        options={{title: t('nav.addPlace')}}
      />
      <Stack.Screen
        name="CreateEventReview"
        component={CreateEventReviewScreen}
        options={{title: t('nav.reviewEvent')}}
      />
      <Stack.Screen
        name="CreateEventSuccess"
        component={CreateEventSuccessScreen}
        options={{title: t('nav.eventCreated')}}
      />
      <Stack.Screen
        name="EditEventGifts"
        component={EditEventGiftsScreen}
        options={{title: t('nav.editGifts')}}
      />
    </Stack.Navigator>
  );
};
