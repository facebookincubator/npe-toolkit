/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file is the client API, and references React-specific constructs
import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {BaseModel, ModelClass} from '@toolkit/data/pads/model';

// Export for convenience
export {
  BaseModel,
  DeletedBy,
  Field,
  InverseField,
  Model,
  ModelUtil,
  Ref,
  type DeletedByTTL,
  type ModelClass,
  type R,
} from '@toolkit/data/pads/model';
export {
  getRepoImpl,
  initRegistry,
  default as registry,
} from '@toolkit/data/pads/registry';
export * from '@toolkit/data/pads/schema';

export type DataStoreProvider = <T extends BaseModel>(
  dataType: ModelClass<T>,
) => DataStore<T>;

// Context key for providing app config using AppContext
export const DATA_STORE_PROVIDER_KEY =
  contextKey<DataStoreProvider>('npe.datastore.pads');

export function useDataStore<T extends BaseModel>(
  dataType: ModelClass<T>,
): DataStore<T> {
  const dataStoreProvider = useAppContext(DATA_STORE_PROVIDER_KEY);
  return dataStoreProvider(dataType);
}

export type UnsubscribeFn = () => void;
export type SubscribeCallbackFn<D> = (resp: {data?: D; error?: Error}) => void;

export type HasId = {
  id: string;
};

// Used for creating / updating edges
// All fields of type, as optional, with edges being expressed as {id: EDGE_ID}
export type Updater<T> = Partial<
  {
    [K in keyof Omit<T, 'id'>]?: T[K] | {id: string} | UpdaterValue;
  } & HasId
>;

export class UpdaterValue {
  private constructor(
    public op: 'fieldDelete' | 'increment' | 'arrayUnion' | 'arrayRemove',
    public params?: any[],
  ) {}
  static fieldDelete(): UpdaterValue {
    return new UpdaterValue('fieldDelete');
  }
  static increment(n: number): UpdaterValue {
    return new UpdaterValue('increment', [n]);
  }
  static arrayUnion(...items: any[]): UpdaterValue {
    return new UpdaterValue('arrayUnion', [items]);
  }
  static arrayRemove(...items: any[]): UpdaterValue {
    return new UpdaterValue('arrayRemove', [items]);
  }
}

export type EdgeSelector =
  | ModelClass<any>
  | [ModelClass<any>, ModelClass<any>, number];

export type Where = {
  field: string;
  // NOTE: `array-contains`, `array-contains-any`, `not-in` op names from Firestore.
  op:
    | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'in'
    | 'not-in'
    | 'array-contains'
    | 'array-contains-any';
  value: string | number | boolean | string[] | number[];
};

export type Order = {
  field: string;
  dir: 'asc' | 'desc';
};

export type Limit<T> = {
  size?: number;
  // Last doc from a previous query
  after?: T;
};

export type EntQuery<T> = {
  where?: Where[];
  order?: Order[];
  limit?: Limit<T>;
};

export type DataStore<T extends BaseModel> = {
  get: (id: string, opts?: {edges?: EdgeSelector[]}) => Promise<Opt<T>>;
  getAll: (opts?: {edges?: EdgeSelector[]}) => Promise<T[]>;
  getMany: (opts?: {
    query?: EntQuery<T>;
    edges?: EdgeSelector[];
  }) => Promise<T[]>;
  subscribeGet: (
    callback: SubscribeCallbackFn<Opt<T>>,
    id: string,
    opts?: {edges?: EdgeSelector[]},
  ) => UnsubscribeFn;
  subscribeGetMany: (
    callback: SubscribeCallbackFn<T[]>,
    opts?: {
      query?: EntQuery<T>;
      edges?: EdgeSelector[];
    },
  ) => UnsubscribeFn;
  create: (value: Updater<T>) => Promise<T>;
  update: (value: Updater<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

// Testing this out as a separate function outside of dataStore API.
// If usage is widespread will likely move into the API
export async function getRequired<T extends BaseModel>(
  store: DataStore<T>,
  id: string,
  opts?: {edges?: EdgeSelector[]},
) {
  const value = await store.get(id, opts);
  if (value == null) {
    // TODO: Expose data type from dataStore and include in developer message
    throw new CodedError('dev.not_found', 'Item not found');
  }
  return value;
}
