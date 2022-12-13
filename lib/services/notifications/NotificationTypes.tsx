/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {User} from '@toolkit/core/api/User';
import {
  BaseModel,
  DeletedBy,
  Field,
  MatchesUser,
  Model,
  Privacy,
  Ref,
  TArray,
  TBool,
  TModel,
  TString,
} from '@toolkit/data/DataStore';

export type DeliveryMethod = 'PUSH' | 'EMAIL' | 'SMS';
export type TokenType = 'ios' | 'android' | 'web' | 'windows' | 'macos';

export type UserNotifEndpoints = {
  pushTokens: string[];
  emails: string[];
  phoneNumbers: string[];
};

/**
 * Push token spec from the client
 */
export type PushToken = {
  type: TokenType;
  token: string;
  sandbox: boolean;
};

/**
 * Push token in storage
 */
@Model({name: 'push_tokens'})
@Privacy({
  '*': MatchesUser('user'),
})
@DeletedBy(Ref('user'))
export class StorageToken extends BaseModel implements PushToken {
  @Field(TString) type: TokenType;
  @Field(TString) token: string;
  @Field(TBool) sandbox: boolean;
  @Field(TString) fcmToken: string;
  @Field() user: User;
}

/**
 * Preference for how a user is notified for a given notification channel
 */
@Model({name: 'notification_pref'})
@Privacy({
  '*': MatchesUser('user'),
})
export class NotificationPref extends BaseModel {
  @Field(TString) channelId: string;
  @Field(TArray(TString)) deliveryMethods: DeliveryMethod[];
  @Field(TBool) enabled: boolean;
  @Field() user: User;
}
