/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {initializeFirebase as _initializeFirebase} from '@npe/lib/firebase/FirebaseConfig';
import {FIREBASE_CONFIG} from 'hax-app-common/Firebase';

export const initializeFirebase = () => {
  return _initializeFirebase(FIREBASE_CONFIG);
};
