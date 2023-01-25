/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {User} from '@toolkit/core/api/User';
import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {
  ExpiredSessionAuthError,
  INVALID_TOKEN,
  INVALID_TOKEN_OLD,
  NotLoggedInError,
} from '@toolkit/tbd/CommonErrors';

/** Types of auth */
export type AuthType =
  | 'facebook'
  | 'google'
  | 'anon'
  | 'phone'
  | 'dev'
  | `oidc.${string}`;

/**
 * App-facing APIs for triggering login flows and updating login state.
 */
export type AuthService<UserType extends User> = {
  /**
   * Get credentials for logging in with a given type of auth. Examples include:
   * - Launching FB or Google login
   * - Asking user to confirm a phone #
   *
   * This flow may launch UI.
   *
   * Throws a `CodedError` with a human readable error message if login fails or was cancelled.
   *
   * This method is a convenience wrapper to make it easy for apps to use multiple login methods
   * with existing utilities, however it is not required to use - apps can use utilities directly
   * for more customization or build their own flows to provide LoginCredentials.
   */
  //
  tryConnect: (
    type: AuthType,
    opts?: {scopes?: string[]},
  ) => Promise<LoginCredential>;

  /**
   * Send a code to the user for a given AuthType.
   *
   * For phone, this is an SMS.
   * For email this can be an email or a code.
   *
   * This code will then be used as the `token` in the `LoginCredential` when calling `login()`.
   *
   * Throws a `CodedError` with a human readable error message if SMS send fails or was cancelled.
   */
  sendCode: (type: AuthType, to: string) => Promise<void>;

  /**
   * Try to log the user in with a given set of credentials.
   *
   * Will first get an account from a shared account service, and then call
   * a hook to translate the account into an app-specific UserType.
   *
   * If User is retrieved *and* canLogin is set on this User, then future getLoggedInUser()
   * calls will return this User.
   *
   * If User is retrieved and canLogin is false, the User will still be returned so the client
   * can use it to populate an onboarding flow (or remediation if the user is banned, etc),
   * but calls to getLoggedInUser() will return null.
   *
   * If User isn't retrieved, a CodedError will be thrown with different codes for each
   * different client side logical response type, as well a message that can be shown to the user
   *
   * Won't launch any UI.
   */
  login: (creds: LoginCredential) => Promise<UserType>;

  /**
   * Clients call this method after onboarding or other steps that would flip canLogin to true on a user.
   *
   * If User meets all requirements to be a Logged In User, this method will return the User and future
   * getLoggedInUser() calls will return this User.
   *
   * If User does not meet requirements, will throw an exception with message or
   * information needed to remediate
   */
  checkLogin: () => Promise<UserType>;

  /**
   * Logs out the currently Logged In User. Future getLoggedInUser() will calls will return null.
   *
   * Also clears the current Account, so future requests to server won't have any
   * credentials associated with them.
   */
  logout: () => Promise<void>;

  /**
   * Gets the currently logged in user. Will wait for app startup / initialization
   * before returning any values.
   */
  getLoggedInUser: () => Promise<UserType | null>;
};

export function useAuth<UserType extends User>(): AuthService<UserType> {
  return useAppContext(AUTH_SERVICE_KEY);
}

export const AUTH_SERVICE_KEY = contextKey<AuthService<any>>('core.auth');

/**
 * A credential supplied to the account system to validate a user for logging in.
 */
export type LoginCredential = {
  /**
   * The type of the auth credential
   */
  type: AuthType;

  /**
   * The unique identifier for this auth credential
   * - For 3P auth, it is the user ID on the 3P site
   * - For phone auth this is the phone #
   * - For email auth this is the email address
   */

  id?: string;

  /**
   * A credential used to verify the user for logging in.
   * - For 3P auth, this will be the accessToken returned from IdentityService
   * - For phone auth this is the confirmation code sent via SMS
   * - For email auth this is the password or a code sent in a URL
   * - For anon auth, can pass in a unique identifier, or empty string
   *   if you want it to be generated
   */
  token: string;
};

/**
 * An account returned from a generric account service.
 *
 * Having an is not sufficient for a appear as logged in to an application
 */

/**
 * An account returned from a generic account service.
 *
 * Having an is necessary but not sufficient for a appear as logged in to an application,
 * as apps need to provider logic to validate accounts rules and add app-specific
 * user fields.
 *
 * Accounts may mirror fields from connected 3rd party providers,
 * however apps should only display information to users from the User object.
 */
export type Account = {
  /**
   * Account ID in the backend system
   */
  id: string;

  /**
   * Access token sent along with server requests to validate the user's identity.
   */
  token: string;

  /**
   * Unique type for the backend system
   */
  type: string;

  /**
   *  Set of roles associated with the account (e.g. "admin", "developer")
   */
  roles?: Opt<string[]>;

  // TODO: Add fields mirrored from 3P login systems
};

export function canLoggingInFix(err: Error | CodedError): boolean {
  return (
    'type' in err &&
    err.type != null &&
    (err.type === ExpiredSessionAuthError.type ||
      err.type === NotLoggedInError.type ||
      err.type === INVALID_TOKEN ||
      err.type === INVALID_TOKEN_OLD)
  );
}
