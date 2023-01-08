/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import {simpleLoginScreen} from '@npe/lib/login/SimpleLoginScreen';
import {Screen} from '@npe/lib/screen/Screen';

const LoginScreen: Screen<{}> = simpleLoginScreen({
  title: 'Hax App Admin',
  authTypes: ['google'],
  home: 'users',
});

LoginScreen.style={
  nav: 'none'
}

export default LoginScreen;
