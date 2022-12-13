/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {
  BaseModel,
  DenyAll,
  Field,
  Model,
  Privacy,
  TArray,
  TString,
} from '@toolkit/data/DataStore';

@Model({name: 'allowlist'})
@Privacy({
  '*': DenyAll(), // TODO: role check
})
export class Allowlist extends BaseModel {
  @Field(TArray(TString)) uids?: string[]; // User IDs
  @Field(TArray(TString)) emails?: string[]; // Emails (exact match)
  @Field(TArray(TString)) emailREs?: string[]; // Email patterns (regex match)
  @Field(TArray(TString)) phones?: string[]; // Phones (formatted, exact match)
}

// Allow "@fb.com" emails
const ALLOW_EMAILRE_LIST = ['.*@fb.com$'];

export function matchUID(uid: string, lists: Allowlist[]): string[] {
  const roles: string[] = [];

  lists.forEach(allowlist => {
    if (!Array.isArray(allowlist.uids)) return;
    if (allowlist.uids.includes(uid)) roles.push(allowlist.id);
  });

  return roles;
}

export function matchPhone(phoneNumber: string, lists: Allowlist[]): string[] {
  const roles: string[] = [];

  lists.forEach(allowlist => {
    if (!Array.isArray(allowlist.phones)) return;
    if (allowlist.phones.includes(phoneNumber)) roles.push(allowlist.id);
  });

  return roles;
}

export function matchEmail(email: string, lists: Allowlist[]): string[] {
  const roles: string[] = [];

  lists.forEach(allowlist => {
    if (Array.isArray(allowlist.emails) && allowlist.emails.includes(email)) {
      roles.push(allowlist.id);
      return;
    }
    if (Array.isArray(allowlist.emailREs)) {
      allowlist.emailREs.forEach(emailRE => {
        if (email.match(emailRE)) {
          roles.push(allowlist.id);
          return;
        }
      });
    }
  });

  ALLOW_EMAILRE_LIST.forEach(emailRE => {
    if (email.match(emailRE)) {
      roles.push('user');
      return;
    }
  });

  return roles;
}
