/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {Role} from '@toolkit/core/api/User';
import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {
  Allowlist,
  matchEmail,
  matchPhone,
  matchUID,
} from '@toolkit/tbd/Allowlist';

export async function getAllowlistMatchedRoles(
  auth: AuthData,
): Promise<Role[]> {
  const allowlistStore = getAdminDataStore(Allowlist);
  const allowlists = await allowlistStore.getAll();
  // Dedup
  return Array.from(
    new Set([
      ...matchUID(auth.uid, allowlists),
      ...(auth.token.phone_number
        ? matchPhone(auth.token.phone_number, allowlists)
        : []),
      ...(auth.token.email && auth.token.email_verified
        ? matchEmail(auth.token.email, allowlists)
        : []),
    ]),
  );
}
