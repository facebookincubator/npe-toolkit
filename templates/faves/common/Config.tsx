/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {FirebaseConfig} from '@toolkit/providers/firebase/Config';

/**
 * Fill in the Firebase config from values at
 * https://console.firebase.google.com/project/YOUR_PROJECT/settings/general/, under "Web apps"
 */
export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'fill-me-in',
  authDomain: 'fill-me-in',
  projectId: 'fill-me-in',
  storageBucket: 'fill-me-in',
  messagingSenderId: 'fill-me-in',
  appId: 'fill-me-in',
  measurementId: 'fill-me-in',
  namespace: 'helloworld',
  emulators: {
    functions: {
      useEmulator: false,
    },
  },
};

/**
 * Fill in the client IDs from
 * https://console.cloud.google.com/apis/credentials?project=YOUR_PROJECT
 *
 * You also will need to add redirect URIs in the console, see
 * https://github.com/facebookincubator/npe-toolkit/blob/main/docs/getting-started/Firebase.md
 */
export const GOOGLE_LOGIN_CONFIG = {
  iosClientId: 'fill-me-in',
  webClientId: 'fill-me-in',
};
