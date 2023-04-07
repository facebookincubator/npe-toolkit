/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import firebase from 'firebase/app';

// Global variable for now
let firebaseConfig: FirebaseConfig;

export const DEFAULT_FUNCTIONS_REGION = 'us-central1';

export type FirebaseConfig = {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  // For Hackathon teams only
  // Set `namespace` to your team or app name in lowercase alphanumeric chars
  // (This enables us to host multiple apps under a Firebase project.)
  // - Firestore data will be added as subcollections under the parent document `project/{namespace}`
  // - Functions will be deploed as `{namespace}-{handler_name}`
  namespace?: string;
  emulators?: {
    functions?: {
      useEmulator: boolean;
      host?: string;
      port?: number;
    };
    firestore?: {
      useEmulator: boolean;
      host?: string;
      port?: number;
    };
  };
  defaultFunctionsRegion?: string;
};

export const initializeFirebase = (
  config: FirebaseConfig,
): firebase.app.App => {
  firebaseConfig = config;
  if (firebase.apps.length === 0) {
    return firebase.initializeApp(firebaseConfig);
  } else {
    return firebase.app();
  }
};

export function getFirebaseConfig(): FirebaseConfig {
  if (!firebaseConfig) {
    // TODO: typed error
    throw Error('Firebase is not initialized');
  }
  return firebaseConfig;
}

export const getFirebaseApp = (): firebase.app.App => {
  if (firebase.apps.length === 0) {
    // TODO: typed error
    throw Error('Firebase is not initialized');
  }
  return firebase.app();
};

export function getFirebaseLib(type?: 'default' | 'admin') {
  let firebaseLib = firebase;
  const IS_SERVER = process.env.GCLOUD_PROJECT != null;
  if (type === 'admin' || IS_SERVER) {
    const requireAlias = require;
    const adminPackage = 'firebase-admin';
    firebaseLib = requireAlias(adminPackage);
  }
  return firebaseLib;
}

const EMULATOR_FIRESTORE_HOST = '127.0.0.1';
const EMULATOR_FIRESTORE_PORT = 8080;

let firestoreInitialized = false;
export function getFirestore() {
  let firebaseLib = getFirebaseLib();
  if (!firestoreInitialized) {
    firestoreInitialized = true;
    const emulatorConfig = firebaseConfig.emulators?.firestore;
    if (emulatorConfig?.useEmulator) {
      firebaseLib
        .firestore()
        .useEmulator(
          emulatorConfig?.host ?? EMULATOR_FIRESTORE_HOST,
          emulatorConfig?.port ?? EMULATOR_FIRESTORE_PORT,
        );
    } else {
      firebaseLib
        .firestore()
        .settings({experimentalForceLongPolling: true, merge: true});
    }
  }
  return firebaseLib.firestore();
}

// TODO: Use app from context (TBD: server context)
export function useFirebaseApp(): firebase.app.App {
  return getFirebaseApp();
}
