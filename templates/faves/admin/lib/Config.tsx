/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {AppConfig, APP_CONFIG_KEY} from '@npe/lib/util/NPEAppConfig';
import {APP_INFO_KEY} from '@npe/lib/ui/Theme';
import icon from '../assets/icon.png';

import {context} from '@npe/lib/util/NPEAppContext';

export const APP_CONFIG = context(APP_CONFIG_KEY, {
  product: 'hax-app-admin',
  fbAppId: '',
});

export const APP_INFO = context(APP_INFO_KEY, {
  appName: 'Hax App',
  appIcon: icon,
});
