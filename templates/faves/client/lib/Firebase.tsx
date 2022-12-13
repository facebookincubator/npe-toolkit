/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {initializeFirebase as _initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FIREBASE_CONFIG} from 'hax-app-common/Firebase';

export const initializeFirebase = () => {
  return _initializeFirebase(FIREBASE_CONFIG);
};
