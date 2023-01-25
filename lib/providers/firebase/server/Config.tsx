/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as admin from 'firebase-admin';
import firebase from 'firebase/app';
import {FirebaseConfig} from '@toolkit/providers/firebase/Config';
import {getAccountInfo} from '@toolkit/providers/firebase/server/Auth';
import {getRequestScope} from '@toolkit/providers/firebase/server/Handler';

// Global variable for now
let firebaseConfig: FirebaseConfig;

/**
 * Init Firebase server config
 */
export function initFirebaseServer(config: FirebaseConfig): admin.app.App {
  const {projectId} = config;
  const defaultOptions = {
    credential: admin.credential.applicationDefault(),
    authDomain: projectId + '.firebaseapp.com',
    databaseUrl: 'https://' + projectId + '.firebaseio.com',
    storageBucket: projectId + '.appspot.com',
    serviceAccountId: `${projectId}@appspot.gserviceaccount.com`,
  };
  firebaseConfig = {...defaultOptions, ...config};
  return admin.initializeApp(firebaseConfig);
}

/**
 * Get the full Firebase config
 */
export function getFirebaseConfig() {
  if (!firebaseConfig) {
    // TODO: typed error
    throw Error('FirebaseServer is not initialized');
  }
  return firebaseConfig;
}

export async function getApp(): Promise<firebase.app.App> {
  let app = getRequestScope().get('app');
  if (app) return app;

  const account = getAccountInfo();
  const appName = account ? account.uid : 'anon';

  // firebase lib may already have this app/appName initialized.
  app = firebase.apps?.find(app => app.name === appName);
  if (!app) {
    app = firebase.initializeApp(getFirebaseConfig(), appName);
    if (account) {
      // Sign in with a custom token. Requires a network call and adds delay.
      const token = await admin.auth().createCustomToken(account.uid);
      await app.auth().signInWithCustomToken(token);
    }
  }

  getRequestScope().set('app', app);
  return app;
}

export function getAdminApp(): admin.app.App {
  if (admin.apps.length === 0) {
    // TODO: typed error
    throw Error('FirebaseServer is not initialized');
  }
  return admin.apps[0]!;
}
