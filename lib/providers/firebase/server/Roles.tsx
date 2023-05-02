/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {Role} from '@toolkit/core/api/User';
import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';

export async function getAllowlistMatchedRoles(
  auth: AuthData,
): Promise<Role[]> {
  const allowlistStore = getAdminDataStore(AllowlistEntry);
  let [phoneEntry, emailEntry] = await Promise.all([
    allowlistStore.get(auth.token.phone ?? ''),
    allowlistStore.get(auth.token.email ?? ''),
  ]);

  const phoneRoles = phoneEntry ? phoneEntry.roles : [];
  const emailRoles = emailEntry ? emailEntry.roles : [];

  return [...phoneRoles, ...emailRoles];
}
