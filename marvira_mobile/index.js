import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

try {
  // Background FCM handler must be registered outside React tree.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async () => {
    // Inbox is source of truth; no local persistence needed here.
  });
} catch {
  // Messaging native module unavailable in some test/dev contexts
}

AppRegistry.registerComponent(appName, () => App);
