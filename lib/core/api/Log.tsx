/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {Platform} from 'react-native';
import {useLoggedInUser} from '@toolkit/core/api/User';
import {
  context,
  contextKey,
  setContextDefault,
  useAppContext,
} from '@toolkit/core/util/AppContext';
import {CodedError} from '@toolkit/core/util/CodedError';

/**
 * For logging events, most clients should use either:
 * - `useLogEvent()` to log a single event at a point in time, or
 * - `useAction()` to log an async action (this includes other cross-cutting functionatily)
 * - `useLogPromise()` to log a promise when the Action API isn't suitable
 *
 * For configuring logging:
 * - Most apps will start using the `DevLogger` in their templates, which gives access to
 *   the log events in developer tools
 * - For production, there will be different options to log to the server,
 *   depending on what systems you are using to report your analytics
 */

/**
 * Simplest way to log an event, can use just a string.
 * The rest of the event payload will be inferred by the context.
 *
 * This is useful for events that are a single point in time - for
 * async actions, use `useLogPromise()`
 */
export function useLogEvent(): (name: string) => void {
  const createLogEvent = useCreateLogEvent();
  const logger = useLogApi();

  return (name: string, where?: string) => {
    const event = createLogEvent(name);
    if (where != null) event.where = where;
    logger(event);
  };
}

/**
 * Create a log entry for a promise.
 * - Duration will be set for the duration of the promise
 * - status will be set based on the success or failure of the promise
 * - If promise is an error, debug will be set to the error stack.
 */
export function useLogPromise<T>(): (
  promise: Promise<T>,
  name: string,
) => void {
  const createLogEvent = useCreateLogEvent();
  const logger = useLogApi();

  return async (promise: Promise<T>, name: string) => {
    const event = createLogEvent(name);

    try {
      await promise;
    } catch (e: any) {
      event.status = 'error';
      if (e instanceof CodedError) {
        event.statusCode = e.type;
      }
      event.errMsg = e.message;
      event.stack = e?.stack;
    } finally {
      event.duration = Date.now() - event.when!;
    }

    logger(event);
  };
}

/**
 * Type and context for a lower level event logger.
 */
type LogApi = (event: LogEvent) => void | Promise<void>;
type UseLogApi = () => LogApi;
export const LOG_CONTEXT_KEY = contextKey<UseLogApi>('core.log');

/**
 * Get the low level event logger. Most clients should *not* use this API directly,
 * as there are a large set of fields that need to be filled in, and the higher
 * level logging apis will do this automatically for you
 */
export function useLogApi(): LogApi {
  const useLogEventImpl = useAppContext(LOG_CONTEXT_KEY);
  const logEvent = useLogEventImpl();
  return logEvent;
}

/**
 * Default logger - does nothing.
 */
function NullLogger() {
  return () => {};
}

export const NULL_LOGGER = context(LOG_CONTEXT_KEY, NullLogger);
setContextDefault(LOG_CONTEXT_KEY, NULL_LOGGER);

/**
 * Logger that stores the last 500 log events in memory,
 * for display in developer tools.
 */
export function DevLogger() {
  return (event: LogEvent) => {
    DEV_LOG_EVENTS.push(event);
    if (DEV_LOG_EVENTS.length > MAX_DEV_LOG_EVENTS) {
      DEV_LOG_EVENTS.shift();
    }
  };
}
export function getDevLogs() {
  return DEV_LOG_EVENTS;
}

const DEV_LOG_EVENTS: LogEvent[] = [];
const MAX_DEV_LOG_EVENTS = 500;

export const DEV_LOGGER = context(LOG_CONTEXT_KEY, DevLogger);

/**
 * Logger that writes to console.log
 */
export function ConsoleLogger() {
  return (event: LogEvent) => {
    if (__DEV__) {
      const eventStr = eventToString(event);
      if (event.status === 'error') {
        console.error(`[Error] ${eventStr}`);
      } else {
        console.log(`[Log] ${eventStr}`);
      }
    }
  };
}
export const CONSOLE_LOGGER = context(LOG_CONTEXT_KEY, ConsoleLogger);

/**
 * Log to multiple sources. All of the loggers must support the same log payload,
 * or allow for `any` payloads.
 */
export function multiLogger<T>(useLogApis: UseLogApi[]): UseLogApi {
  return () => {
    const logEvents = useLogApis.map(useLogApi => useLogApi());
    return (event: LogEvent) => {
      try {
        logEvents.forEach(logEvent => logEvent(event));
      } catch (e) {
        console.error(e);
      }
    };
  };
}

/**
 * Convience wrapper to create a`MultiLogger` from a list of loggers.
 */
export function MultiLogger(useLogApis: UseLogApi[]) {
  return context(LOG_CONTEXT_KEY, multiLogger(useLogApis));
}

function useCreateLogEvent(): (name: string) => LogEvent {
  // Ideally we want the version here that doesn't throw at startup. Hmm
  const user = useLoggedInUser();
  const {where} = useCallerId();
  //console.log('where', where);

  // TODO: Get where from navigation
  // TODO: Get user from auth
  return (name: string) => ({
    user: user?.id,
    name,
    where,
    when: Date.now(),
    status: 'ok',
    platform: Platform.OS,
  });
}

export function eventToString(event: LogEvent) {
  let str = (event.where != null ? event.where + '::' : '') + event.name;

  if (event.when) {
    const d = new Date(event.when);
    const date = d.toLocaleString('en-US', {hour12: false}).replace(', ', '.');
    str += ` @${date}.${d.getMilliseconds()}`;
  }
  if (event.duration != null) {
    str += `, Duration Ms: ${event.duration}`;
  }

  if (event.status !== 'ok') {
    str += `, Status: ${event.status}`;
    if (event.statusCode != null) {
      str += ` [${event.statusCode}]`;
    }
    if (event.errMsg != null) {
      str += `, ${event.errMsg}`;
    }
  }

  return str;
}

/**
 * Logged events need to be associated with a place from which they were initiated.
 * This the name of a screen, a background process, or a server API endpoint.
 *
 * To allow logging from lower-level code that doesn't direct access to this information,
 * we are providing it via context.
 *
 * This uses `React.Context` instead of `AppContext` as there will be different
 * values per screen in the app. `AppContext` is for app-global values that
 * change infrequently.
 *
 * This may be useful for use cases beyond logging (e.g. rate limiting API calls separately
 * based on which screen called then).
 */
type CallerId = {
  where: string;
};

/**
 * Default context is an app-level context. This is needed for logging events
 * that occur outside of the context of any specific screen.
 */
export const CallerIdContext = React.createContext<CallerId>({
  where: 'App',
});

export function useCallerId(): CallerId {
  return React.useContext(CallerIdContext);
}

/**
 * Low level event payload for sending log even data to logging systems.
 *
 * Most clients will only interact with a small set of these fields directly.
 */
type LogEvent = {
  /** ID of the user at device or for whose data this is being executed */
  user?: string;

  /** Event name */
  name: string;

  /** Where in the app the event took place. Can be a screen, or a logical background or server process */
  where?: string;

  /** When the event occurred */
  when?: number;

  /** Duration of the event. Will default to time event is processed if not set */
  duration?: number;

  /** Status of the event, defaults to 'ok' */
  status?: 'ok' | 'timeout' | 'error' | 'cancelled';

  /** Status code, for more information on error status results */
  statusCode?: string;

  /** Error message, when available */
  errMsg?: string;

  /** Full stack trace, when available */
  stack?: string;

  /** Platform from which this request came */
  platform?: typeof Platform.OS | 'server';

  /*
  To add:
  - session
  - source
  - deviceType
   */
};
