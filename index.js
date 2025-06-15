import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import onBackgroundEvent from './src/services/backgroundHandler';

notifee.onBackgroundEvent(onBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask(
  'NotifeeBackgroundEvent',
  () => onBackgroundEvent,
);
