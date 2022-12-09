/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {StatusBarStyle} from 'expo-status-bar';
import {ImageSourcePropType} from 'react-native';
import {
  contextKey,
  setContextDefault,
  useAppContext,
} from '@toolkit/core/util/AppContext';

/**
 * Least-common denominator set of themes for component rendering.
 *
 * Note: Unclear if this approach will scale, and may end up allowing customization
 * at the component level (e.g. customize the `<Button>` vs params for the buttons).
 */
export type BasicTheme = {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  // TODO: Remove this, belongs in parent app config
  statusBarStyle?: StatusBarStyle;
};

const BASIC_BLACK: BasicTheme = {
  backgroundColor: '#FFF',
  textColor: '#000',
  buttonColor: '#000',
  buttonTextColor: '#FFF',
  statusBarStyle: 'light',
};

export const BASIC_THEME_KEY = contextKey<BasicTheme>('npe.basic_theme');
setContextDefault(BASIC_THEME_KEY, BASIC_BLACK);

export const useTheme = (): BasicTheme => {
  return useAppContext(BASIC_THEME_KEY);
};

/**
 * Common UI information about the app.
 *
 * Difference between this and themes - themes can be shared,
 * while `AppInfo` is different per app.
 */
export type AppInfo = {
  appName: string;
  appIcon: ImageSourcePropType;
};

export const APP_INFO_KEY = contextKey<AppInfo>('npe.app_info');

export const useAppInfo = (): AppInfo => {
  return useAppContext(APP_INFO_KEY);
};
