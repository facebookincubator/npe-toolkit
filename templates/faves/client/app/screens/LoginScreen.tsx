/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  SimpleLoginScreenConfig,
  simpleLoginScreen,
} from '@toolkit/screens/login/LoginScreen';
import {Screen} from '@toolkit/ui/screen/Screen';

const LOGIN_SCREEN_CONFIG: SimpleLoginScreenConfig = {
  title: 'Welcome to HelloWorld',
  subtitle:
    'This is a Simple Login Screen. \nEdit app/screens/LoginScreen.tsx to edit this!',
  authTypes: ['google'],
  home: 'AllThingsScreen',
  tos: 'Edit this markdown to link to your your **Terms of Service**.',
};

const LoginScreen: Screen<{}> = simpleLoginScreen(LOGIN_SCREEN_CONFIG);
LoginScreen.style = {type: 'top', nav: 'none'};

export default LoginScreen;
