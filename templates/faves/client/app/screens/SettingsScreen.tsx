/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {View} from 'react-native';
import {useAuth} from '@toolkit/core/api/Auth';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import Settings, {Setting} from '@toolkit/screens/Settings';
import {NotificationSettingsScreen} from '@toolkit/screens/settings/NotificationSettings';
import {navToAction} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {openUrlAction} from '@toolkit/ui/screen/WebScreen';
import AboutScreen from './AboutScreen';

const META_TOS = {
  id: 'META_TOS',
  label: 'Terms of Service',
  url: 'https://www.facebook.com/legal/terms',
};

const NPE_TOS = {
  id: 'NPE_TOS',
  label: 'NPE Supplemental Terms',
  url: 'https://npe.facebook.com/about/terms',
};

const META_DATA_POLICY = {
  id: 'DATA_POLICY',
  label: 'Data Policy',
  url: 'https://www.facebook.com/about/privacy',
};

const NPE_EU_DATA_POLICY = {
  id: 'NPE_EU_DATA_POLICY',
  label: 'NPE EU Data Policy',
  url: 'https://npe.facebook.com/about/eu_data_policy',
};

const ABOUT = {
  icon: 'information-outline',
  label: 'About',
  to: AboutScreen,
};

const NOTIF_SETTINGS = {
  label: 'Notifications',
  icon: 'bell-ring-outline',
  to: NotificationSettingsScreen,
};

const DEV_SETTINGS = () => {
  const {showMessage} = useUserMessaging();
  return {
    id: 'DEV_SETTINGS',
    label: 'Dev Settings',
    icon: 'wrench-outline',
    act: () => showMessage('coming soon'!),
  };
};

export const LOGOUT_ACTION = () => {
  const auth = useAuth();
  return {
    id: 'LOGOUT',
    label: 'Log Out',
    icon: 'logout',
    act: () => auth.logout(),
  };
};

const SETTINGS: Setting[] = [
  DEV_SETTINGS,
  navToAction(NOTIF_SETTINGS),
  LOGOUT_ACTION,
  navToAction(ABOUT),
  'LEGAL',
  openUrlAction(META_TOS),
  openUrlAction(META_DATA_POLICY),
  openUrlAction(NPE_TOS),
  openUrlAction(NPE_EU_DATA_POLICY),
];

const SettingsScreen: Screen<{}> = () => {
  requireLoggedInUser();

  return (
    <View style={{padding: 20}}>
      <Settings settings={SETTINGS} />
    </View>
  );
};

SettingsScreen.title = 'Settings';

export default SettingsScreen;
