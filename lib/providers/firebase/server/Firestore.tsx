/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as admin from 'firebase-admin';
import {BaseModel, DataStore, ModelClass} from '@toolkit/data/DataStore';
import {
  FirestoreConfig,
  firebaseStore,
} from '@toolkit/providers/firebase/DataStore';
import {
  getAdminApp,
  getApp,
  getFirebaseConfig,
} from '@toolkit/providers/firebase/server/Config';
import 'firebase/auth';
import 'firebase/firestore';

let alwaysUseAdminDatastore: boolean;

/**
 * By default, server requests operate in the context of the currently
 * logged in user and not as the "admin" role, which provides safer access to data.
 * This can be overridden at a callsite by using `getAdminDataStore()` but if you are
 * prototyping only or are sure it is safe to always run in the admin context, you can
 * call `setAlwaysUseAdminDatastore(true)`.
 * 
  // TODO: Add Github Wiki for enforcing Firebase security in functions
 */
export function setAlwaysUseAdminDatastore(value: boolean) {
  alwaysUseAdminDatastore = value;
}

export async function getDataStore<T extends BaseModel>(
  entityType: ModelClass<T>,
): Promise<DataStore<T>> {
  const conf = getFirebaseConfig();
  if (alwaysUseAdminDatastore) {
    return getAdminDataStore(entityType);
  }
  const app = await getApp();
  return firebaseStore(entityType, app.firestore(), undefined, {
    namespace: conf.namespace,
  });
}

export function getAdminDataStore<T extends BaseModel>(
  entityType: ModelClass<T>,
  transaction?: admin.firestore.Transaction,
  firestoreConfig?: FirestoreConfig,
): DataStore<T> {
  const conf = getFirebaseConfig();
  const app = getAdminApp();
  return firebaseStore(
    entityType,
    // @ts-ignore
    app.firestore(),
    transaction,
    firestoreConfig ?? {
      namespace: conf.namespace,
    },
  );
}
