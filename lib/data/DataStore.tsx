/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

// This file is the client API, and references React-specific constructs
import {BaseModel, ModelClass} from '@npe/pads/src/model';
import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {Opt} from '@toolkit/core/util/Types';

// Export for convenience
export * from '@npe/pads/src/deletion';
export {
  BaseModel,
  Field,
  InverseField,
  Model,
  ModelClass,
  ModelUtil,
  R,
} from '@npe/pads/src/model';
export * from '@npe/pads/src/privacy';
export {
  default as registry,
  getRepoImpl,
  initRegistry,
} from '@npe/pads/src/registry';
export * from '@npe/pads/src/schema';

export type DataStoreProvider = <T extends BaseModel>(
  dataType: ModelClass<T>,
) => DataStore<T>;

// Context key for providing app config using NPEAppContext
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