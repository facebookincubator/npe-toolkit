/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import * as React from 'react';
import {
  contextKey,
  setInitialAppContext,
  useAppContext,
} from '@toolkit/core/util/AppContext';

type ReloadFn = () => void;
export const RELOAD = contextKey<ReloadFn>('util.reload');

// Call this in a top-level app component you'd like to see reloaded
// Callers can check the state is the same to see if re-render is due to force relocd
export function useReloadState(): number {
  const [reloadState, setReloadState] = React.useState(0);
  const reloads = React.useRef(0);

  function reload() {
    reloads.current = reloads.current + 1;
    setReloadState(reloads.current);
  }
  setInitialAppContext(RELOAD, reload);
  return reloadState;
}

// Returns function that will reload
export function useReload(): ReloadFn {
  return useAppContext(RELOAD);
}
