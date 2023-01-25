/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';

/**
 * Utilities for having central config keyed off of a logical "product" key for the app.
 * Has typed config common fields as well as arbitrary key values.
 *
 * This allows utilities at all levels of the code to operate just by knowing the
 * "product", and
 *
 * Note: Didn't call this appId because that was overloaded, but "product" feels maybe confusing
 * TODO: Possibly switch to appKey or similar
 */

// All fields are optional, as not all apps use all features
// and configuration might be set from multiple places
export type AppConfig = {
  /** String product ID */
  product: string;

  /**
   * App ID in the FB developer console @ https://developers.facebook.com/apps/
   *
   * Onlhy needed if you are logging in with Facebook auth.
   */
  fbAppId?: string;
};

// Context key for providing app config using NPEAppContext
export const APP_CONFIG_KEY = contextKey<AppConfig>('appConfig');

// $FlowIgnore
type CfgVal = any;

const appConfigs: {[key: string]: AppConfig} = {};
const keyValueConfigs: {[key: string]: {[key: string]: CfgVal}} = {};

// Registers app config and also makes it the default value for ??? in the tree does this really work with app context?
export function registerAppConfig(config: AppConfig) {
  const existing = appConfigs[config.product];
  appConfigs[config.product] = existing
    ? {...existing, ...config}
    : {...config};
}

export function useAppConfig(): AppConfig {
  return useAppContext('appConfig');
}

export function getAppConfig(product: string): AppConfig {
  const existing = appConfigs[product];
  if (!existing) {
    throw Error(`AppConfig doesn't exist for '${product}'`);
  }
  return existing;
}

export function setConfigValue(product: string, key: string, value: CfgVal) {
  const cfg = keyValueConfigs[product] || {};
  cfg[key] = value;
  keyValueConfigs[product] = cfg;
}

export function getConfigValue(product: string, key: string): CfgVal {
  const existing = keyValueConfigs?.[product]?.[key];
  if (!existing) {
    throw Error(`AppConfig doesn't exist for '${product}'`);
  }
  return existing;
}

export function allAppConfigs(): AppConfig[] {
  return Object.keys(appConfigs).map(key => appConfigs[key]);
}
