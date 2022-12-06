/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

export type ApiKey<I, O> = {id: string};
export type Api<I, O> = (input: I) => Promise<O>;

export function createApiKey<I, O>(id: string) {
  const key: ApiKey<I, O> = {id};
  return key;
}

export type DataKey<I, O> = {dataId: string};
export type UseData<I, O> = () => Api<I, O>;

const dataKeys: Record<string, () => Api<any, any>> = {};

function createDataKey<I, O>(dataId: string) {
  const key: DataKey<I, O> = {dataId};
  return key;
}

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
export function useData<I, O>(dataKey: DataKey<I, O>): Api<I, O> {
  const useDataFn: any = dataKeys[dataKey.dataId];
  if (useDataFn == null) {
    throw Error(`Attempt to use unregistered Data key ${dataKey.dataId}`);
  }
  return useDataFn();
}

export function dataApi<I, O>(id: string, impl: UseData<I, O>): DataKey<I, O> {
  const key = createDataKey<I, O>(id);
  dataKeys[id] = impl;
  return key;
}
