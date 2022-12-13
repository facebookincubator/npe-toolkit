/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

//

import * as Analytics from 'expo-firebase-analytics';
import {ClientLogParams, LOG_CONTEXT_KEY} from '@toolkit/core/api/Log';
import {context} from '@toolkit/core/util/AppContext';

function FirebaseLogger() {
  // TODO: Hook into account information
  // TODO: Log current screen
  // TODO: Fork FirebaseAnalytics so we don't have to use global firebase analytics config.
  // (or determine that it's OK to use initFirebase() fields

  return (event: string, payload?: ClientLogParams): void => {
    // TODO: Verify that payload params all fit into Firebase log fields
    Analytics.logEvent(event, payload);
  };
}

export const FIREBASE_LOGGER = context(LOG_CONTEXT_KEY, FirebaseLogger);
