/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Opt} from '@toolkit/core/util/Types';

export type ApiKey<I, O> = {id: string};
export type Api<I, O> = (input: I) => Promise<O>;

export function createApiKey<I, O>(id: string) {
  const key: ApiKey<I, O> = {id};
  return key;
}

export type UseApi<I, O> = (key: ApiKey<I, O>) => Api<I, O>;

const apis: Record<string, UseApi<any, any>> = {};

/**
 * Register an implementation that provides the data for a given key.
 *
 * ## Usage
 *
 * *Using Data*
 * ```
 * function MyComponent() {
 *   const doIt = useData(DoIt);
 *
 *   async function onPress() {
 *     await doIt();
 *     ...
 *   }
 *
 *   return <Button onPress={onPress}/>
 * }
 * ```
 *
 * *Defining a Key*
 * ```
 *  const DoIt = dataApi<InputType, OutputType>('doit', () => {
 *    // Hooks go here
 *    const dataStore = useDataStore(THING);
 *
 *    return async (input:InputType) => {
 *      // Call data store methods here or anything else async
 *    }
 *  });
 * ```
 */
export function useData<I, O>(key: ApiKey<I, O>): Api<I, O> {
  const useDataFn = apis[key.id] as Opt<UseApi<I, O>>;
  if (useDataFn == null) {
    throw Error(`Attempt to use unregistered API Key ${key.id}`);
  }
  return useDataFn(key);
}

export function api<I, O>(id: string, fn: UseApi<I, O>): ApiKey<I, O> {
  const key = createApiKey<I, O>(id);
  apis[id] = fn;
  return key;
}

/**
 * @deprecated Will switch all to `registerApi()`
 */
export const dataApi = api;
