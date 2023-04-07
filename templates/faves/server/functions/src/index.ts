/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {initFirebaseServer} from '@toolkit/providers/firebase/server/Config';
import {initMiddlewares} from '@toolkit/providers/firebase/server/Handler';
import {
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
} from '@toolkit/providers/firebase/server/Handler';
import {FIREBASE_CONFIG} from '@app/common/Config';

// Follow the wiki below to enable Firestore security rule enforcement in Functions:
// https://www.internalfb.com/intern/wiki/NPE/Central_Engineering/NPE_Kit/Guides/Enforcing_Security_Rules_in_Firebase_Functions_or_Server_Code/
initFirebaseServer(FIREBASE_CONFIG);

initMiddlewares([
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
]);

exports.helloworld = require('./handlers');

// Experimental deletion support - not ready for production
// Uncomment here and also where installing screens in admin panel to experiment with deletion
// import * as deletionHandlers from '@toolkit/experimental/deletion/providers/firebase/Deletion';
// exports.helloworld.deletion = deletionHandlers;
