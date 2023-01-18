/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {APP_INFO_KEY} from '@toolkit/core/client/Theme';
import {APP_CONFIG_KEY} from '@toolkit/core/util/AppConfig';
import {context} from '@toolkit/core/util/AppContext';
import icon from '../assets/icon.png';

export const APP_CONFIG = context(APP_CONFIG_KEY, {
  product: 'hax-app-admin',
  fbAppId: '',
});

export const APP_INFO = context(APP_INFO_KEY, {
  appName: 'Hax App',
  appIcon: icon,
});
