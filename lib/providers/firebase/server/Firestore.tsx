/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, DataStore, ModelClass} from '@toolkit/data/DataStore';
import {
  firebaseStore,
  FirestoreConfig,
} from '@toolkit/providers/firebase/DataStore';
import {
  getAdminApp,
  getApp,
  getFirebaseConfig,
} from '@toolkit/providers/firebase/server/Config';
import * as admin from 'firebase-admin';
import 'firebase/auth';
import 'firebase/firestore';

export async function getDataStore<T extends BaseModel>(
  entityType: ModelClass<T>,
): Promise<DataStore<T>> {
  const conf = getFirebaseConfig();
  if (conf.forceAdminDatastore) {
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
