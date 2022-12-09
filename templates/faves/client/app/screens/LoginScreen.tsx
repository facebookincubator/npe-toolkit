/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {
  SimpleLoginScreenConfig,
  simpleLoginScreen,
} from '@toolkit/screens/login/LoginScreen';
import {Screen} from '@toolkit/ui/screen/Screen';

const LOGIN_SCREEN_CONFIG: SimpleLoginScreenConfig = {
  title: 'Welcome to Hax App',
  subtitle:
    'This is a Simple Login Screen. \nEdit app/screens/LoginScreen.tsx to edit this!',
  authTypes: ['google'],
  home: 'AllThingsScreen',
};

const LoginScreen: Screen<{}> = simpleLoginScreen(LOGIN_SCREEN_CONFIG);
LoginScreen.style = {type: 'top', nav: 'none'};

export default LoginScreen;
