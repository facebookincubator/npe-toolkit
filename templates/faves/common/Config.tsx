/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {FirebaseConfig} from '@toolkit/providers/firebase/Config';
import {GoogleLoginConfig} from '@toolkit/providers/login/GoogleLogin';

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'fill-me-in',
  authDomain: 'fill-me-in',
  projectId: 'fill-me-in',
  storageBucket: 'fill-me-in',
  messagingSenderId: 'fill-me-in',
  appId: 'fill-me-in',
  measurementId: 'G-Z82QMREN4V',
  namespace: 'helloworld',
  emulators: {
    functions: {
      useEmulator: false,
    },
  },
};

export const GOOGLE_LOGIN_CONFIG: GoogleLoginConfig = {
  iosClientId: 'fill-me-in',
  webClientId: 'fill-me-in',
};
