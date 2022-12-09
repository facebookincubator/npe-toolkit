/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {useAuth} from '@toolkit/core/api/Auth';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useNavigation} from '@react-navigation/native';
import Constants from 'expo-constants';
import * as React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import AppIcon from '../../assets/splash.png';
import AllThingsScreen from './AllThingsScreen';

/**
 * Screen shown during initial async initialization
 */
const StartupScreen: Screen<{}> = () => {
  const nav = useNav();
  const reactNav = useNavigation<any>();
  const auth = useAuth();

  // Disable animation from splash screen to app
  React.useLayoutEffect(() => {
    reactNav.setOptions({animation: 'none'});
  }, [reactNav]);

  // Async initialization that occurs before redirecting to main app
  async function waitForInitialization() {
    await auth.getLoggedInUser();
    nav.reset(AllThingsScreen);
  }

  React.useEffect(() => {
    waitForInitialization();
  }, []);

  // Based on https://github.com/expo/examples/tree/master/with-splash-screen,
  // without animation
  return (
    <View style={{flex: 1}}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Constants.manifest?.splash?.backgroundColor,
            opacity: 1,
          },
        ]}>
        <Image
          style={{
            width: '100%',
            height: '100%',
            resizeMode: Constants.manifest?.splash?.resizeMode || 'contain',
          }}
          source={AppIcon}
        />
      </View>
    </View>
  );
};
StartupScreen.style = {nav: 'none'};

export default StartupScreen;
