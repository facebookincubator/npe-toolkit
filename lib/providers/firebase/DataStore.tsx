/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Firestore based implmentation of DataStore API, that works on both client and server.
 *
 * Implementation notes:
 * Firebase has same APIs on client and server, but in different namespaces. It made
 * sense to share the library code, but needed a little hackery to do so:
 * - Import firebase (the client library) for the type definitions (`Query`, `CollectionReference`)
 *   on both client and server
 * - This adds overhead to the server code, as this code is unused at runtime, but adding
 *   one library dependency to the server deployment didn't seeem to be significant overhead
 * - Actual instantiation of the firestore instance uses `require` statement on server to use
 *   the server specific library
 *     - Having the code `require('firebase-admin')` always imported, even when the code path
 *       wasn't triggered ("smart" compilation step), but using an alias for "require"
 *       prevented automatic importing
 */

import firebase from 'firebase/app';
import {context} from '@toolkit/core/util/AppContext';
import {Opt} from '@toolkit/core/util/Types';
import {uuidv4} from '@toolkit/core/util/Util';
import {
  BaseModel,
  DATA_STORE_PROVIDER_KEY,
  DataStore,
  DataStoreProvider,
  EdgeSelector,
  EntQuery,
  ModelClass,
  ModelUtil,
  SubscribeCallbackFn,
  UnsubscribeFn,
  Updater,
  UpdaterValue,
  isArrayType,
  isInverseModelRefType,
  isModelRefType,
} from '@toolkit/data/DataStore';
import {
  getFirebaseConfig,
  getFirebaseLib,
  getFirestore,
} from '@toolkit/providers/firebase/Config';
import 'firebase/firestore';

let DevUtil: any;
try {
  DevUtil = require('@toolkit/core/util/DevUtil');
} catch (e) {}

type Query<T> = firebase.firestore.Query<T>;
type CollectionReference<T> = firebase.firestore.CollectionReference<T>;

const FirestoreFieldValue = getFirebaseLib().firestore.FieldValue;
const ERROR_TXN_READ_NOT_SUPPORTED = new Error(
  'Transaction read not support yet',
);
const ERROR_TXN_SUBSCRIPTION_NOT_SUPPORTED = new Error(
  'Transaction can not be used with subscription',
);

// TODO: Use app/firestore from context
function useFirestore() {
  return getFirestore();
}

function useFirestoreConfig() {
  try {
    return {
      namespace: getFirebaseConfig().namespace,
      keepEdge: false,
    };
  } catch (err) {
    // Likely called from server code that isn't using `FirebaseServerFirestore`
    // TODO: need to patch call sites directly calling `firebaseStore()`
    console.error(err);
  }
  return null;
}

export type FirestoreConfig = {
  namespace?: string;
  keepEdge?: boolean;
};

export function firebaseStore<T extends BaseModel>(
  entityType: ModelClass<T>,
  // NOTE: Could be of type `firebase.firestore` or `firebase-admin.firestore`
  firestore?: firebase.firestore.Firestore,
  // NOTE: `firebase.firestore.Transaction` and `firebase-admin.firestore.Transaction` APIs are different
  // e.g. missing `create`, `getAll`, `get(query)` in `firebase.firestore.Transaction`
  firestoreTxn?: firebase.firestore.Transaction,
  firestoreConfig?: FirestoreConfig,
): DataStore<T> {
  const store = firestore || useFirestore();

  const config = firestoreConfig || useFirestoreConfig();
  const prefix = config?.namespace ? `instance/${config.namespace}/` : '';
  const name = ModelUtil.getName(entityType);

  async function getCollection(): Promise<CollectionReference<T>> {
    DevUtil && (await DevUtil.networkDelay());
    // TODO: Add support for multiple databases, path-prefixed, in same firestore
    // TODO: Add support for getting Firebase App from React Context

    // @ts-ignore
    return store.collection(prefix + name).withConverter(converter);
  }

  function getCollectionSync(): CollectionReference<T> {
    // TODO: Add support for multiple databases, path-prefixed, in same firestore
    // TODO: Add support for getting Firebase App from React Context

    // @ts-ignore
    return store.collection(prefix + name).withConverter(converter);
  }

  const converter = {
    toFirestore(t: Updater<T>): firebase.firestore.DocumentData {
      return internalRepresentationOf(t);
    },
    fromFirestore(
      snapshot: firebase.firestore.QueryDocumentSnapshot,
      options: firebase.firestore.SnapshotOptions,
    ): T {
      const data = snapshot.data(options)!;
      if (data) {
        data.id = snapshot.id;
      }
      return toModel(data);
    },
  };

  async function loadEdgesFromIds(
    entities: any[],
    key: string,
    thisEdge: ModelClass<any>,
    edges: EdgeSelector[],
  ): Promise<void> {
    const edgeStore = await firebaseStore(
      thisEdge,
      store,
      firestoreTxn,
      config ?? undefined,
    );

    // Load edge by the ID(s)
    const values = await Promise.all(
      entities.map(entity => {
        const idOrIds = entity[key];
        if (Array.isArray(idOrIds)) {
          return idOrIds == null
            ? Promise.resolve()
            : // TODO: switch to `in` in batches. `in` has a limit of 10.
              Promise.all(idOrIds.map(id => edgeStore.get(id, {edges})));
        } else {
          return idOrIds == null
            ? Promise.resolve()
            : edgeStore.get(idOrIds, {edges});
        }
      }),
    );

    values.forEach((value, index) => {
      entities[index][key] = value;
    });
  }

  async function loadIncomingEdges(
    entities: any[],
    key: string,
    thisEdge: ModelClass<any>,
    edges: EdgeSelector[],
    isKeyFieldArray: boolean,
  ): Promise<T[]> {
    const edgeSchema = ModelUtil.getSchema(thisEdge);
    const edgeStore = await firebaseStore(
      thisEdge,
      store,
      firestoreTxn,
      config ?? undefined,
    );

    let fieldToMatch: string = '';
    for (const [key, val] of Object.entries(edgeSchema)) {
      const type = val.type;
      const isArray = isArrayType(type);
      // @ts-ignore
      const elemType = isArray ? type.getElementType() : type;
      if (isModelRefType(elemType)) {
        const edgeModelClass = elemType.getModelClass();
        if (edgeModelClass === entityType) {
          fieldToMatch = key;
        }
      }
    }
    if (fieldToMatch === '') {
      throw Error('No matching edge found');
    }

    const values: any[] = await Promise.all(
      entities.map(entity => {
        return edgeStore.getMany({
          query: {
            where: [{field: fieldToMatch, op: '==', value: entity.id}],
          },
          edges,
        });
      }),
    );

    values.forEach((value, index) => {
      if (isKeyFieldArray) {
        entities[index][key] = value;
      } else {
        entities[index][key] = value.shift();
      }
    });
    return values;
  }

  async function getDocumentRef(id: string) {
    if (firestoreTxn) {
      return firestore!.doc(`${prefix}${name}/${id}`);
    } else {
      const collection = await getCollection();
      return collection.doc(id);
    }
  }

  function deepCopyEdges(edges: EdgeSelector[]): EdgeSelector[] {
    return edges.map(edge => {
      if (Array.isArray(edge)) {
        return [...edge];
      } else {
        return edge;
      }
    });
  }

  function findEdge(
    edgeType: ModelClass<any>,
    edges: EdgeSelector[],
  ): Opt<ModelClass<any>> {
    if (edgeType == null) {
      throw Error(`Edge type is required: ${edgeType}`);
    }
    for (const edge of edges) {
      if (Array.isArray(edge)) {
        if (edge[0] === entityType && edge[1] === edgeType && edge[2] > 0) {
          edge[2] -= 1;
          return edge[1];
        }
      } else {
        if (edge === edgeType) {
          return edge;
        }
      }
    }
    return null;
  }
  async function walkEdges(entities: T[], edges: EdgeSelector[]) {
    const schema = ModelUtil.getSchema(entityType);

    const promises: Promise<any>[] = [];

    for (const [key, val] of Object.entries(schema)) {
      const type = val.type;
      const isArray = isArrayType(type);
      // @ts-ignore
      const elemType = isArray ? type.getElementType() : type;
      const edgeCopies = deepCopyEdges(edges);
      if (isModelRefType(elemType)) {
        const edgeModelClass = elemType.getModelClass();
        const thisEdge = findEdge(edgeModelClass, edgeCopies);
        if (!thisEdge) {
          // @ts-ignore
          if (!config?.keepEdge) entities.forEach(value => delete value[key]);
          continue;
        }
        promises.push(
          loadEdgesFromIds(entities, key, edgeModelClass, edgeCopies),
        );
      } else if (isInverseModelRefType(elemType)) {
        const edgeModelClass = elemType.getModelClass();
        const thisEdge = findEdge(edgeModelClass, edgeCopies);
        if (!thisEdge) {
          // @ts-ignore
          if (!config?.keepEdge) entities.forEach(value => delete value[key]);
          continue;
        }
        promises.push(
          loadIncomingEdges(entities, key, edgeModelClass, edgeCopies, isArray),
        );
      }
    }

    await Promise.all(promises);
  }

  async function getFirebaseDocs(
    query: Query<T>,
    edges: EdgeSelector[],
  ): Promise<T[]> {
    if (firestoreTxn && isClientTransaction(firestoreTxn))
      throw ERROR_TXN_READ_NOT_SUPPORTED;

    let docList;
    if (firestoreTxn) {
      // @ts-ignore
      docList = (await firestoreTxn.get(query)) as QuerySnapshot<T>;
    } else {
      docList = await query.get();
    }

    const result = docList.docs.map((doc: any) => {
      const value = doc.data();
      value.id = doc.id;
      return value;
    });

    await walkEdges(result, edges);
    return result;
  }

  async function get(id: string, opts?: {edges?: EdgeSelector[]}) {
    if (firestoreTxn && isClientTransaction(firestoreTxn))
      throw ERROR_TXN_READ_NOT_SUPPORTED;

    const edges = opts?.edges || [];
    const collection = await getCollection();
    const doc = collection.doc(id);

    let value: Opt<T>;
    if (firestoreTxn) {
      // Converter not being used for txn. Call `internalRepresentationOf` explicitly.
      value = toModel((await firestoreTxn.get(doc)).data());
    } else {
      value = (await doc.get()).data();
    }

    if (value != null) {
      value.id = id;
      await walkEdges([value], edges);
    }

    return value;
  }

  function subscribeGet(
    callback: SubscribeCallbackFn<Opt<T>>,
    id: string,
    opts?: {edges?: EdgeSelector[]},
  ): UnsubscribeFn {
    if (firestoreTxn) throw ERROR_TXN_SUBSCRIPTION_NOT_SUPPORTED;
    const edges = opts?.edges || [];
    const collection = getCollectionSync();

    return collection.doc(id).onSnapshot(
      {includeMetadataChanges: true},
      async doc => {
        // Skip local changes
        if (doc.metadata.hasPendingWrites) {
          return;
        }

        const value: Opt<T> = doc.data();
        if (value != null) {
          value.id = id;
          await walkEdges([value], edges);
        }

        return callback({
          data: value,
        });
      },
      error => {
        return callback({
          error,
        });
      },
    );
  }

  async function requiredGet(id: string, edges: EdgeSelector[]) {
    const value = await get(id);
    if (!value) {
      throw Error(`Item ID ${id} not found`);
    }
    return value;
  }

  async function getAll(opts?: {edges?: EdgeSelector[]}): Promise<T[]> {
    return await getMany(opts);
  }

  function applyQuery(collection: Query<T>, query: EntQuery<T>) {
    let result = collection;
    if (query.where) {
      for (const where of query?.where) {
        result = result.where(where.field, where.op, where.value);
      }
    }
    if (query.order) {
      for (const order of query.order) {
        result = result.orderBy(order.field, order.dir);
      }
    }
    if (query.limit) {
      if (query.limit.after) {
        if (!query.order)
          throw Error('Can not set `limit.after` without `order`');
        // @ts-ignore
        let vals = query.order.map(order => query.limit.after[order.field]);
        // NOTE: does not support (Edge) id offsets and should have `orderby` fields
        result = result.startAfter(...vals);
      }
      if (query.limit.size) {
        result = result.limit(query.limit.size);
      }
    }
    return result;
  }

  async function getMany(opts?: {query?: EntQuery<T>; edges?: EdgeSelector[]}) {
    const collection = await getCollection();
    const query = applyQuery(collection, opts?.query || {});
    return await getFirebaseDocs(query, opts?.edges || []);
  }

  function subscribeGetMany(
    callback: SubscribeCallbackFn<T[]>,
    opts?: {query?: EntQuery<T>; edges?: EdgeSelector[]},
  ): UnsubscribeFn {
    if (firestoreTxn) throw ERROR_TXN_SUBSCRIPTION_NOT_SUPPORTED;
    const edges = opts?.edges || [];
    const collection = getCollectionSync();

    const query = applyQuery(collection, opts?.query || {});

    return query.onSnapshot(
      {includeMetadataChanges: true},
      async qs => {
        // Skip local changes
        if (qs.metadata.hasPendingWrites) {
          return;
        }

        const result = qs.docs.map((doc: any) => {
          const value = doc.data();
          value.id = doc.id;
          return value;
        });

        await walkEdges(result, edges);
        return callback({
          data: result,
        });
      },
      error => {
        return callback({
          error,
        });
      },
    );
  }

  function internalRepresentationOf(value: Updater<T>) {
    const filteredValue = {};
    for (const k in value) {
      // @ts-ignore
      if (value[k] instanceof UpdaterValue) {
        continue;
      }
      // @ts-ignore
      filteredValue[k] = value[k];
    }

    const internal: any = toDatastoreRepresentation(
      // @ts-ignore
      entityType._toRawData(filteredValue),
    );

    // For now, ID isn't saved on the object itself
    delete internal['id'];

    for (const k in value) {
      // @ts-ignore
      if (!(value[k] instanceof UpdaterValue)) {
        continue;
      }
      // @ts-ignore
      const updaterVal = value[k] as UpdaterValue;
      switch (updaterVal.op) {
        case 'arrayRemove':
          internal[k] = FirestoreFieldValue.arrayRemove(
            ...updaterVal.params![0],
          );
          break;
        case 'arrayUnion':
          internal[k] = FirestoreFieldValue.arrayUnion(
            ...updaterVal.params![0],
          );
          break;
        case 'increment':
          internal[k] = FirestoreFieldValue.increment(updaterVal.params![0]);
          break;
        case 'fieldDelete':
          internal[k] = FirestoreFieldValue.delete();
          break;
        default:
          throw new Error(`Invalid ${updaterVal.op}`);
      }
    }

    return internal;
  }

  function toModel(m?: any): T {
    if (!m) return m;
    const schema = ModelUtil.getSchema(entityType);
    const data: T = {...m};
    for (const key in data) {
      const type = schema[key]?.type;
      if (!type) {
        delete data[key];
        continue;
      }
    }
    // Return a JSON (vs a Model instance) for backward compatibility
    return data;
  }

  async function create(v: Updater<T>) {
    const value = {...v};
    // If value.id is undefined, create our own ID
    const id = value.id ?? name + ':' + uuidv4();
    const doc = await getDocumentRef(id);
    const now = Date.now();
    value.createdAt = value.createdAt ?? now;
    value.updatedAt = value.updatedAt ?? now;
    if (firestoreTxn) {
      // Converter not being used for txn. Call `internalRepresentationOf` explicitly.
      return firestoreTxn.set(doc, internalRepresentationOf(value));
    } else {
      await doc.set(value);
      return await requiredGet(id, []);
    }
  }

  async function update(v: Updater<T>) {
    const value = {...v};
    if (!value.id) {
      throw Error('Must have an ID to update');
    }
    const now = Date.now();
    value.updatedAt = value.updatedAt ?? now;
    const doc = await getDocumentRef(value.id);

    if (firestoreTxn) {
      // Converter not being used for txn. Call `internalRepresentationOf` explicitly.
      return firestoreTxn.set(doc, internalRepresentationOf(value), {
        merge: true,
      });
    } else {
      await doc.set(value, {merge: true});
      return await requiredGet(value.id, []);
    }
  }

  async function remove(id: string) {
    const doc = await getDocumentRef(id);
    if (firestoreTxn) {
      firestoreTxn.delete(doc);
    } else {
      await doc.delete();
    }
  }

  return {
    get,
    getAll,
    getMany,
    // @ts-ignore: transaction support breaks DataStore interface
    create,
    remove,
    // @ts-ignore: transaction support breaks DataStore interface
    update,
    subscribeGet,
    subscribeGetMany,
  };
}

function isClientTransaction(transaction: any) {
  return transaction instanceof firebase.firestore.Transaction;
}

const useProvideDataStore: DataStoreProvider = <M extends BaseModel>(
  dataType: ModelClass<M>,
) => {
  return firebaseStore(dataType);
};

export const FIRESTORE_DATASTORE = context(
  DATA_STORE_PROVIDER_KEY,
  useProvideDataStore,
);

export function toDatastoreRepresentation(data: any) {
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'undefined') {
      delete data[key];
      continue;
    }
    // For repo=>datastore compatibility, store `id` directly
    if (value.type === 'ModelRef') {
      data[key] = value.id;
    }
    if (Array.isArray(value)) {
      data[key] = value.map(v => {
        if (v.type === 'ModelRef') return v.id;
        else if (v.type === 'FirebaseStorageRef') return v.fullPath;
        else return v;
      });
    }
  }
  return data;
}

export function toRepoRepresentation<M extends BaseModel>(
  modelClass: ModelClass<M>,
  data: any,
) {
  const schema = ModelUtil.getSchema(modelClass);
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'undefined') {
      delete data[key];
      continue;
    }
    const type = schema[key]?.type;
    // @ts-ignore
    const elemType = isArrayType(type) ? type.getElementType() : type;
    if (!isModelRefType(elemType)) {
      continue;
    }
    // For datastore=>repo compatibility, convert `id:string` to `{id: string}`
    if (Array.isArray(value)) {
      data[key] = value.map(v =>
        typeof v === 'string' ? elemType.toRawData({id: v}) : v,
      );
    } else {
      data[key] =
        typeof value === 'string' ? elemType.toRawData({id: value}) : value;
    }
  }
  return data;
}
