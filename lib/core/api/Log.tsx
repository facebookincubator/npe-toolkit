/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Common, cross-platform utilties for NPE logging. Other files are platform-specific

import {
  context,
  contextKey,
  setContextDefault,
  useAppContext,
} from '@toolkit/core/util/AppContext';

// These are the fields that client is currently allowed to set.
// Event is kept as a separate, top-level param
export type ClientLogParams = {
  duration?: string;
  end_state?: string;
  end_state_code?: string;
  debug_info?: string;
};

// TODO: Default!
export const LOG_CONTEXT_KEY =
  contextKey<UseLogApi<ClientLogParams>>('core.log');

export type LogApi<T> = (event: string, params?: T) => void;
export type UseLogApi<T> = () => LogApi<T>;

// Use system defined log event service
export function useLogEvent(): LogApi<ClientLogParams> {
  const useLogEventImpl = useAppContext(LOG_CONTEXT_KEY);
  const logEvent = useLogEventImpl();
  return logEvent;
}

function NullLogger() {
  return (_event: string, _payload?: any) => {};
}
export const NULL_LOGGER = context(LOG_CONTEXT_KEY, NullLogger);
setContextDefault(LOG_CONTEXT_KEY, NULL_LOGGER);

export function ConsoleLogger() {
  return (event: string, payload?: any) => {
    if (__DEV__) {
      console.log(`LogEvent: ${event}`, payload ?? '');
    }
  };
}
export const CONSOLE_LOGGER = context(LOG_CONTEXT_KEY, ConsoleLogger);

/**
 * Log to multiple sources. All of the loggers must support the same log payload,
 * or allow for `any` payloads.
 */
export function multiLogger<T>(useLogApis: UseLogApi<T>[]): UseLogApi<T> {
  return () => {
    const logEvents = useLogApis.map(useLogApi => useLogApi());
    return (event: string, params?: T) => {
      try {
        logEvents.forEach(logEvent => logEvent(event, params));
      } catch (e) {
        console.error(e);
      }
    };
  };
}

/**
 * Convience wrapper to create a`MultiLogger<ClientLogParams>` context
 */
export function MultiLogger(useLogApis: UseLogApi<ClientLogParams>[]) {
  return context(LOG_CONTEXT_KEY, multiLogger(useLogApis));
}

export function eventFromCamelCase(event: string): string {
  return event.replace(/([a-z])([A-Z])/, '$1_$2').toUpperCase();
}
