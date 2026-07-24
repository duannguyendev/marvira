import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToEventDetails(eventId: string): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('Main', {
    screen: 'Home',
    params: {
      screen: 'EventDetails',
      params: { eventId },
    },
  });
  return true;
}
