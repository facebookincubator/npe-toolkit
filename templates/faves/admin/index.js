/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
