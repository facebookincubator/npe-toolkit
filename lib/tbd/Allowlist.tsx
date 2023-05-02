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

/**
 * Allowlist is a data stucture to give permissions and access to the app for
 * users before they have signed up for an account.
 *
 * It uses an email or phone # key to identify the user, and provides
 * a list of roles for the user.
 */
@Model({name: 'allowlist'})
export class AllowlistEntry extends BaseModel {
  /** User Key can be email, phone, or user ID depending on login type */
  @Field() userKey: string;
  /** Roles is array of roles for that user */
  @Field(TArray(TString)) roles: Role[];
}
