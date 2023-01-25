/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {
  BaseModel,
  Field,
  Model,
  TArray,
  TBool,
  TModel,
  TString,
} from '@toolkit/data/DataStore';
import {NotLoggedInError} from '@toolkit/tbd/CommonErrors';

@Model({name: 'user_roles'})
export class UserRoles extends BaseModel {
  @Field(TArray(TString)) roles: string[];
}

/**
 * Base type for users.
 *
 * Only id, name, and canLogin are required fields to set.
 *
 * All other fields are optional, and if set they will be used in a "standard" way for that type of field.
 *
 * Apps can also extend with User with any fields they would like, with custom semantics for the app.
 *
 */
@Model({name: 'user'})
export class User extends BaseModel {
  /**
   * A name that can be used in the UI to show to the user to identity which account
   * is logged in with. Generally this is full name, username, or the user's email
   */
  @Field(TString) name: string;
  /**
   * Whether the user is allowed to view content and take operations asa a fully
   * logged-in user
   */
  @Field(TBool) canLogin: boolean;
  /**
   * URL of the user's profile picture
   */
  @Field(TString) pic?: string | null | undefined;
  /**
   * The user's primary email
   */
  @Field(TString) email?: string | null | undefined;
  /**
   * Whether the email has been verified
   */
  @Field(TBool) emailVerified?: boolean | null | undefined;
  /**
   * The user's primary phone number,
   * formatted for the country of the current request.
   */
  @Field(TString) phone?: string | null | undefined;
  /**
   * Whether the phone # has been verified
   */
  @Field(TBool) phoneVerified?: boolean | null | undefined;
  /**
   * A unique username across all users of the app
   */
  @Field(TString) username?: string | null | undefined;
  /**
   * Set of roles associated with the user (e.g. "admin", "dev")
   *
   * All enforcement of role-based access is handled on the server, and on the server,
   * this field is authoritative. On the client, these values are provided to determine
   * what UI and actions to make available to the user
   */
  @Field(TModel(UserRoles)) roles?: UserRoles;
}

// Base type for profile. Profile is public to other users.
@Model({name: 'profile'})
export class Profile extends BaseModel {
  @Field(TString) pic?: string | null | undefined;
  @Field(TString) name: string;
  @Field(TModel(User)) user?: User;
}

/**
 * Register this API to provide a user to components in the app.
 *
 * AuthServices are the primary way of providing these users, however you can
 * also implement and register your own API if you aren't using AuthServices
 * or want to provide Mock or dev users.
 *
 * The context API is a hook so that it can use context.
 */
export type UseUserApi<UserType extends User> = () => UserType | null;

export const LOGGED_IN_USER_API_KEY =
  contextKey<UseUserApi<any>>('core.userapi');

/**
 * Hook to get the current user.
 *
 * Throws a promise if initial user hasn't been set as part of app startup.
 */
export function useLoggedInUser<UserType extends User>(): UserType | null {
  const useLoggedInUserApi = useAppContext(LOGGED_IN_USER_API_KEY);

  // So this doesn't actually trigger state changes, as the state call isn't inside of it. Hmmm...
  return useLoggedInUserApi();
}

/**
 * Hook to get the current user.
 *
 * Throws an error that should be caught and redirected to a login page if there
 * the user is not logged in.
 *
 * Throws a promise if initial user hasn't been set as part of app startup.
 */
export function requireLoggedInUser<UserType extends User>(): UserType {
  const user = useLoggedInUser<UserType>();
  if (user == null) {
    throw NotLoggedInError();
  }
  return user;
}
