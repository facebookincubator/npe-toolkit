/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import * as admin from 'firebase-admin';
import firebase from 'firebase/app';
import {FirebaseConfig} from '@toolkit/providers/firebase/Config';
import {getAccountInfo} from '@toolkit/providers/firebase/server/Auth';
import {getRequestScope} from '@toolkit/providers/firebase/server/Handler';

// Global variable for now
let firebaseConfig: FirebaseServerConfig & admin.AppOptions;

export type FirebaseServerConfig = FirebaseConfig & {
  // Follow the wiki below to enable Firestore security rule enforcement in Functions:
  // https://www.internalfb.com/intern/wiki/NPE/Central_Engineering/NPE_Kit/Guides/Enforcing_Security_Rules_in_Firebase_Functions_or_Server_Code/
  forceAdminDatastore?: boolean; // `true` to bypass Firestore security rule enforcement in Functions
  deletionConfig?: {
    retryMaxAttempts?: number;
    retryMinBackoffSeconds?: number;
    maxConcurrentDispatches?: number;
    ttlCronSchedule?: string;
  };
};

/**
 * Init Firebase server config
 */
export function initFirebaseServer(
  config: FirebaseServerConfig,
): admin.app.App {
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
