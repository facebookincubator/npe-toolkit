/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Image, Linking, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Constants from 'expo-constants';
import {useAuth} from '@toolkit/core/api/Auth';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {FIREBASE_CONFIG} from '@app/common/Config';
import AppIcon from '../../assets/splash.png';
import AllThingsScreen from './AllThingsScreen';

/**
 * Checks that new apps have been initiatlized sufficiently so that they can run.
 * If not initialized, returns a string listing steps to take, and startup screen
 * will stay instead of redirecting to full app.
 *
 * You can delete this after the checks have been satisfied.
 */
function newAppChecks() {
  const checks = [];

  if (FIREBASE_CONFIG.projectId === 'fill-me-in') {
    checks.push({
      link: 'https://github.com/facebookincubator/npe-toolkit/blob/main/docs/getting-started/Firebase.md',
      text: 'Configure Firebase',
    });
  }

  return {
    passed: checks.length === 0,
    checks,
  };
}

/**
 * Screen shown during initial async initialization
 */
const StartupScreen: Screen<{}> = () => {
  const nav = useNav();
  const reactNav = useNavigation<any>();
  const auth = useAuth();
  const appChecks = newAppChecks();

  // Disable animation from splash screen to app
  React.useLayoutEffect(() => {
    reactNav.setOptions({animation: 'none'});
  }, [reactNav]);

  // Async initialization that occurs before redirecting to main app
  async function waitForInitialization() {
    if (appChecks.passed) {
      await auth.getLoggedInUser();
      nav.reset(AllThingsScreen);
    }
  }

  React.useEffect(() => {
    waitForInitialization();
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={S.appChecks}>
        {!appChecks.passed && (
          <View>
            <Text style={{fontWeight: 'bold', lineHeight: 24, fontSize: 18}}>
              Additional app setup needed
            </Text>
            {appChecks.checks.map((check, idx) => (
              <Text style={{lineHeight: 28, fontSize: 16}} key={idx}>
                ⦿{'  '}
                <Text
                  style={{textDecorationLine: 'underline'}}
                  onPress={() => Linking.openURL(check.link)}>
                  {check.text}
                </Text>
              </Text>
            ))}
          </View>
        )}
      </View>
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

const S = StyleSheet.create({
  appChecks: {
    position: 'absolute',
    width: '100%',
    padding: 32,
    zIndex: 40,
  },
});

export default StartupScreen;
