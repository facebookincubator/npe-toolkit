/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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
