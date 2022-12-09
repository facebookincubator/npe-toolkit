/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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

  /** App ID in the FB developer console @ https://developers.facebook.com/apps/ */
  fbAppId?: string;

  /** NPE App FBID, of type NPEEntApplication */
  npeAppFbid?: string;

  /** NPE App ID enum, of type NPEApplication */
  npeAppId?: number;

  /** Client secret for NPE app */
  npeClientSecret?: string;

  /**
   * Default URL for requests to your API server.
   * This will be overridable in the dev UI
   * You can point this at a persistent dev server for early
   * prototyping / demos before you have launched
   * a production service.
   */
  apiUrl?: string;

  /**
   * API URLs can have a dev-mode formatter that sets the URL given
   * numeric input. This is useful for setting OD / devserver URLs
   * in a mobile UI, as it's many fewer charcters to type
   */
  apiUrlFormatter?: string;

  /**
   * Base URl for logging requests.
   */
  logUrl?: string;

  /**
   * www backed apps have different request format
   */
  isWWW?: boolean;
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