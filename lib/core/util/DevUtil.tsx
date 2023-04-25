/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLoggedInUser} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const TimeoutError = new CodedError(
  'npe.action.timeout',
  'Operation exceeded timeout',
);

/**
 * Return a promise that throws after a timeout if the
 * underlying timeout hasn't been fulfilled.
 *
 * Note that this doesn't stop the underlying promise from executing,
 * just will ignore the result from that promise.
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const wrapped = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(TimeoutError), timeoutMs);
    });

    const result = await Promise.race([fn(), timeoutPromise]);
    return result;
  };

  return wrapped();
}

// TODO: Make this settable in Dev Settings
/**
 * Fake network delay i
 */
let networkDelayMs = 0;
let networkDelayLoaded = false;
const NETWORK_DELAY_KEY = 'dev.networkDelay';

/**
 * Delay for testing - will always be set to 0 delay in production.
 */
export async function networkDelay() {
  if (!networkDelayLoaded) {
    networkDelayMs = await getNetworkDelayMs();
    networkDelayLoaded = true;
  }
  return sleep(networkDelayMs);
}

export async function getNetworkDelayMs() {
  const stored = await AsyncStorage.getItem(NETWORK_DELAY_KEY);
  networkDelayMs = stored != null ? Number(stored) : 0;
  return networkDelayMs;
}

/**
 * Hook to set the network delay. This only needs to be called once in development,
 * after that it will be sticky. To reset, call again with delay = 0.
 *
 * Only enabled for development mode (local builds or user has "DEV" role)
 *
 * Usage:
 * ```
 * const setNetworkDelay = useSetNetworkDelay();
 * ...
 * setNetworkDelay(2000);
 * ```
 */

export function useSetNetworkDelay() {
  const isDev = useIsDev();

  return (delayMs: number) => {
    if (isDev) {
      networkDelayMs = delayMs;
      AsyncStorage.setItem(NETWORK_DELAY_KEY, String(delayMs));
    }
  };
}

/**
 * Whether developer features are enabled.
 *
 * (it's a hook because it may use localStorage in future)
 */
export function useIsDev() {
  const user = useLoggedInUser();

  if (user?.roles != null && user?.roles.roles.indexOf('DEV') != -1) {
    return true;
  }

  return __DEV__ === true;
}
