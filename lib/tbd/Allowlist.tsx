/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Role} from '@toolkit/core/api/User';
import {
  BaseModel,
  Field,
  Model,
  TArray,
  TString,
} from '@toolkit/data/DataStore';

@Model({name: 'allowlist'})
export class Allowlist extends BaseModel {
  @Field(TArray(TString)) uids?: string[]; // User IDs
  @Field(TArray(TString)) emails?: string[]; // Emails (exact match)
  @Field(TArray(TString)) emailREs?: string[]; // Email patterns (regex match)
  @Field(TArray(TString)) phones?: string[]; // Phones (formatted, exact match)
}

// TODO: Limit this to your initial test account emails
const ALLOW_EMAILRE_LIST = ['.*'];

export function matchUID(uid: string, lists: Allowlist[]): Role[] {
  const roles: Role[] = [];

  lists.forEach(allowlist => {
    if (!Array.isArray(allowlist.uids)) return;
    if (allowlist.uids.includes(uid)) roles.push(allowlist.id as Role);
  });

  return roles;
}

export function matchPhone(phoneNumber: string, lists: Allowlist[]): Role[] {
  const roles: Role[] = [];

  lists.forEach(allowlist => {
    if (!Array.isArray(allowlist.phones)) return;
    if (allowlist.phones.includes(phoneNumber))
      roles.push(allowlist.id as Role);
  });

  return roles;
}

export function matchEmail(email: string, lists: Allowlist[]): Role[] {
  const roles: Role[] = [];

  lists.forEach(allowlist => {
    if (Array.isArray(allowlist.emails) && allowlist.emails.includes(email)) {
      roles.push(allowlist.id as Role);
      return;
    }
    if (Array.isArray(allowlist.emailREs)) {
      allowlist.emailREs.forEach(emailRE => {
        if (email.match(emailRE)) {
          roles.push(allowlist.id as Role);
          return;
        }
      });
    }
  });

  ALLOW_EMAILRE_LIST.forEach(emailRE => {
    if (email.match(emailRE)) {
      roles.push('USER');
      return;
    }
  });

  return roles;
}
