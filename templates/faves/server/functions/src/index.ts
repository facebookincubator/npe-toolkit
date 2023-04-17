/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {APP_CONFIG, FIREBASE_CONFIG} from '@app/common/Config';
import {initFirebaseServer} from '@toolkit/providers/firebase/server/Config';
import {
  AuthenticateMiddleware,
  ResultLoggerMiddleware,
  RolesCheckMiddleware,
  initMiddlewares,
} from '@toolkit/providers/firebase/server/Handler';

// Follow the wiki below to enable Firestore security rule enforcement in Functions:
// https://github.com/facebookincubator/npe-toolkit/blob/main/docs/datastore/server-rules.md
initFirebaseServer(FIREBASE_CONFIG, APP_CONFIG);

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
