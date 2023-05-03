/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {Role} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';

function hasValue(value: Opt<string>) {
  return value != null && value !== '';
}

export async function getAllowlistMatchedRoles(
  auth: AuthData,
): Promise<Role[]> {
  const allowlistStore = getAdminDataStore(AllowlistEntry);
  const {phone, email} = auth.token;

  let [phoneEntry, emailEntry] = await Promise.all([
    hasValue(phone) ? allowlistStore.get('allowlist:' + phone) : {roles: []},
    hasValue(email)
      ? allowlistStore.get('allowlist:' + email ?? '')
      : {roles: []},
  ]);

  const phoneRoles = phoneEntry ? phoneEntry.roles : [];
  const emailRoles = emailEntry ? emailEntry.roles : [];

  return [...phoneRoles, ...emailRoles];
}
