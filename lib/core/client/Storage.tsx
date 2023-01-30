/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Promised from '@toolkit/core/util/Promised';

type StorageType<T> = (value: string) => T;
// $FlowIgnore
type AnyType = any;

export const STRING: StorageType<string> = value => value;
export const BOOL: StorageType<boolean> = value => value === 'true';
export const INT: StorageType<number> = value => Number(value);
export const ANY: StorageType<any> = value => JSON.parse(value);

const INTERNAL_CACHE: {[key: string]: Promised<AnyType>} = {};
const LISTENERS: {[key: string]: (() => void)[]} = {};

// useState() equivalent backed with client storage
// Can throw while loading, so needs to be wrapped in <React.Suspense>
export function useStored<T>(
  key: string,
  type: StorageType<T>,
  defaultVal: T,
): [T, (t: T) => Promise<void>] {
  const [promise, setValue] = useStoredAsync(key, type, defaultVal);
  return [promise.getValue(), setValue];
}

export function useStoredAsync<T>(
  key: string,
  type: StorageType<T>,
  defaultVal: T,
): [Promised<T>, (t: T) => Promise<void>] {
  const current = getStored(key, type, defaultVal);
  const [value, setValue] = React.useState(current);

  React.useEffect(() => {
    const onChange = () => setValue(INTERNAL_CACHE[key]);
    listenForStorageChange(key, onChange);
    return () => unlistenForStorageChange(key, onChange);
  }, [key]);

  const updateValue = (newVal: T | null) => setStored(key, type, newVal);

  return [value, updateValue];
}

// Non-hook version
export function getStored<T>(
  key: string,
  type: StorageType<T>,
  defaultVal: T,
): Promised<T> {
  if (!(key in INTERNAL_CACHE)) {
    INTERNAL_CACHE[key] = new Promised(
      AsyncStorage.getItem(key).then(value => {
        return value != null ? type(value) : defaultVal;
      }),
    );
  }
  return INTERNAL_CACHE[key];
}

// Set the value - null will clear
export async function setStored<T>(
  key: string,
  type: StorageType<T>,
  value: T | null,
) {
  const oldValue = await getStored(key, type, null);

  if (value === oldValue) {
    return;
  }

  if (value == null) {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(
      key,
      type === ANY ? JSON.stringify(value) : String(value),
    );
  }
  INTERNAL_CACHE[key] = new Promised(value);
  onStorageChange(key);
}

function listenForStorageChange(key: string, fn: () => void) {
  LISTENERS[key] = LISTENERS[key] || [];
  LISTENERS[key].push(fn);
}

function unlistenForStorageChange(key: string, fn: () => void) {
  const listeners = LISTENERS[key];
  if (!listeners) {
    return;
  }

  const index = listeners.indexOf(fn);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}

function onStorageChange(key: string) {
  const listeners = LISTENERS[key] || [];
  for (const listener of listeners) {
    listener();
  }
}
