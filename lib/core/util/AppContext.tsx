/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-ignore

import * as React from 'react';
import nullthrows from 'nullthrows';
import {Opt} from '@toolkit/core/util/Types';

export type ContextObj = {[key: string]: any};

/**
 * Key to look up / set entries in AppContext.
 */
export class ContextKey<T> {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

/**
 * Utility function create a typed context key.
 */
export function contextKey<T>(id: string): ContextKey<T> {
  return {id};
}

// Default implementations will normally be no-op
// or developer-only implementations
const DEFAULT_IMPLS: ContextObj = {};

/**
 * Default implementations generally shouldn't depend on a specific server backend
 * (e.g. Firebase, Python, AWS).
 *
 * However if an API is tied closely to a specific platform and is pluggable
 * solely for testing / mocking, it may be appropriate to have a
 * default tied to a specific platform.
 */
export function setContextDefault<T>(key: ContextKey<T>, impl: T) {
  DEFAULT_IMPLS[key.id] = impl;
}

// Temporary type to support both type-unafe string and type-safe ContextKey
type Key<T> = ContextKey<T> | string;

// Context that re-renders when any changes - should be static or rarely changing
type AppContextApi = {
  set: <T>(key: Key<T>, value: T, setState: boolean) => void;
  get: <T>(key: Key<T>) => T | null;
};

function keyToString<T>(key: Key<T>): string {
  return typeof key === 'string' ? key : key.id;
}

export const useAppContext = <T,>(key: Key<T>): T => {
  const api =
    offlineContext ||
    nullthrows(React.useContext(AppContext), 'AppContext must exist');

  const value = nullthrows<T>(
    api.get(key) ?? DEFAULT_IMPLS[keyToString(key)],
    `AppContext for key "${keyToString(key)}" must exist.`,
  );

  return value;
};

let offlineContext: Opt<AppContextApi>;

// Context for usage outside React component tree
export const withAppContext = (ctx: Context<any>[], fn: () => void) => {
  if (offlineContext != null) {
    throw Error("Can't set offline context twice");
  }

  const contextMap = toContextMap(ctx);

  const api = {
    set: <T,>(key: Key<T>, value: T, setState: boolean) => {
      throw Error("Can't set values in offline context");
    },
    get: <T,>(key: Key<T>) => {
      return contextMap[keyToString(key)];
    },
  };

  offlineContext = api;
  try {
    fn();
  } catch (e) {
    console.log('that didnt work', e);
  } finally {
    offlineContext = null;
  }
};

export const setInitialAppContext = <T,>(key: Key<T>, value: T): void => {
  const api = nullthrows(React.useContext(AppContext), 'AppContext must exist');
  api.set(key, value, false);
};

export const useSetAppContext = <T,>(key: Key<T>): ((value: T) => void) => {
  const api = nullthrows(React.useContext(AppContext), 'AppContext must exist');
  return value => api.set(key, value, true);
};

/**
 * Encapsulated type for providing context for a key.
 */
export type Context<T> = T & {
  _key: ContextKey<T>;
};

/**
 * Variant of Context<> that can be used in arrays.
 * Verifies that _key is set on the object
 * (couldn't get full type checking working to verify that _key matches
 * the type of the object)
 */
type IsContext = {_key: ContextKey<any>};

/**
 * Util to create a context for a given key
 */
export function context<T>(key: ContextKey<T>, value: T): Context<T> {
  if (typeof value === 'function') {
    const result: any = value;
    result._key = key;
    return result;
  }
  return {...value, _key: key};
}

// The context
const AppContext: React.Context<AppContextApi | null> =
  React.createContext<AppContextApi | null>(null);

function toContextMap(ctx?: ContextObj | Context<any>[]): ContextObj {
  if (ctx?.forEach) {
    const result: ContextObj = {};
    ctx.forEach((item: Context<any>) => {
      const {_key, ...value} = item;
      result[_key.id] = typeof item === 'function' ? item : value;
    });
    return result;
  }

  return {...ctx};
}

/**
 * AppContext is a wrapper around React Context that provides the following benefits:
 * - Doesn't require a new top-level React Component for each new item to add to the context
 * - While still providing type safety
 * - [future] Will enable using outside of React Components (e.g. Tasks)
 *
 * Goals are (a) to make it easy to provide context, and (b) to avoid using globals
 * (any time you are considering using a global variable, see if you can use AppContext instead),
 * and (c) Allow hosting multiple apps inside the same shell (very useful for quick deployment
 * to attach to an existing binary, but this only works if apps have siloed config)
 *
 * Types of variables that make sense in app context:
 * - Configuration: API Keys, URLs, etc
 * - Customizations: Styles, service providers for a given API (e.g. a LogProvider)
 * - Infrequently changing global app state: Current user, locale
 *
 * Usage:
 *
 * At top level of app...
 * ```
 * import {provider, AppContextProvider} from '@toolkit/core/util/AppContext'
 * import {STYLE_KEY} from '../somestylelib/StyleContext';
 *
 * const STYLE = context(STYLE_KEY, {fontColor: 'orange'});
 *
 * <AppContextProvider ctx={[STYLE]}>
 *   ... your app content here, eg
 *   <MainAppComponent/>
 * </AppContextProvider>
 *```

 * Setting initial context values in subcomponents of AppContextProvider:
 * ```
 * import {FIREBASE_CONFIG} from '../FirebaseUtils';
 *
 * function MainAppComponent() {
 *   setInitialAppContext(FIREBASE_CONFIG, {apiKey: 'abc', ...});
 *
 *   return <View>...</View>
 * }
 * ```
 *
 * Using context:
 * ```
 *   const style = useAppContext(STYLE);
 *   const firebaseConfig = useAppContext(FIREBASE_CONFIG);
 *
 *   doSomethingWith(style, firebaseConfig);
 * ```
 *
 * A common pattern for context will be to wrap the `useAppContext()` call
 * in a utility function. So the above  might turn into:
 * ```
 *   const style = useStyle()
 *   const firebaseConfig = useFirebaseConfig();
 *
 *   doSomethingWith(style, firebaseConfig);
 * ```
 *
 */
// TODO: Remove non-typesafe ContextObj option
export const AppContextProvider = <T extends any[]>(props: {
  children?: React.ReactNode;
  ctx?: ContextObj | IsContext[];
}) => {
  const {children} = props;
  const ctx = toContextMap(props.ctx);
  const [contextMap, setContextMap] = React.useState(ctx);

  const api = React.useMemo(
    () => ({
      set: <T,>(key: Key<T>, value: T, setState: boolean): void => {
        contextMap[keyToString(key)] = value;
        if (setState) {
          setContextMap({...contextMap});
        }
      },
      get: <T,>(key: Key<T>): T | null => {
        return contextMap[keyToString(key)];
      },
    }),
    [contextMap],
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
};
