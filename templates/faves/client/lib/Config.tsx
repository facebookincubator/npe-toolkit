/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NOTIF_CHANNELS} from '@app/common/NotifChannels';
import {NOTIF_CHANNELS_KEY} from '@toolkit/services/notifications/NotificationChannel';
import {APP_INFO_KEY} from '@toolkit/core/client/Theme';
import {AppConfig, APP_CONFIG_KEY} from '@toolkit/core/util/AppConfig';
import {Context, context} from '@toolkit/core/util/AppContext';

import icon from '../assets/icon.png';

export const APP_CONFIG: Context<AppConfig> = {
  product: 'helloworld',
  fbAppId: '',
  _key: APP_CONFIG_KEY,
};

export const APP_INFO = context(APP_INFO_KEY, {
  appName: 'HelloWorld',
  appIcon: icon,
});

export const NOTIF_CHANNELS_CONTEXT = context(
  NOTIF_CHANNELS_KEY,
  NOTIF_CHANNELS,
);
