/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {simpleLoginScreen} from '@toolkit/screens/login/LoginScreen';
import {Screen} from '@toolkit/ui/screen/Screen';

const LoginScreen: Screen<{}> = simpleLoginScreen({
  title: 'Hax App Admin',
  authTypes: ['google'],
  home: 'users',
});

LoginScreen.style = {
  nav: 'none',
};

export default LoginScreen;
