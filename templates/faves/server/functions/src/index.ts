/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {initFirebaseServer} from '@npe/lib/firebase/server/FirebaseServerConfig';
import {initMiddlewares} from '@npe/lib/firebase/server/FirebaseServerHandler';
import {
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
} from '@npe/lib/firebase/server/FirebaseServerMiddleware';
import {FIREBASE_CONFIG} from 'hax-app-common/Firebase';

// Follow the wiki below to enable Firestore security rule enforcement in Functions:
// https://www.internalfb.com/intern/wiki/NPE/Central_Engineering/NPE_Kit/Guides/Enforcing_Security_Rules_in_Firebase_Functions_or_Server_Code/
initFirebaseServer({
  ...FIREBASE_CONFIG,
  deletionConfig: {
    ttlCronSchedule: 'every 1 hours',
  },
});

initMiddlewares([
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
]);

exports.haxapp = require('./handlers');
exports.haxapp.deletion = require('./deletion');
