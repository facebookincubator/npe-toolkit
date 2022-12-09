/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {initializeFirebase as _initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FIREBASE_CONFIG} from 'hax-app-common/Firebase';

export const initializeFirebase = () => {
  return _initializeFirebase(FIREBASE_CONFIG);
};
