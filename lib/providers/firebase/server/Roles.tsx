/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';
import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {
  Allowlist,
  matchEmail,
  matchPhone,
  matchUID,
} from '@toolkit/tbd/Allowlist';

export async function getAllowlistMatchedRoles(
  auth: AuthData,
): Promise<string[]> {
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