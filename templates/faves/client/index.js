/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import {registerRootComponent} from 'expo';
import {LogBox, YellowBox, Platform} from 'react-native';

if (Platform.OS !== 'web') {
  LogBox.ignoreLogs([
    'Require cycle',
    'AsyncStorage',
    'Unhandled Promise Rejection',
    'Non-serializable values',
    'Did not receive response to shouldStartLoad',
  ]);
}

const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
