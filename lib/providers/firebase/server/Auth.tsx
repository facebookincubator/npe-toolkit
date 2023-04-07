/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  AuthData,
  CallableContext,
} from 'firebase-functions/lib/common/providers/https';
import {User} from '@toolkit/core/api/User';
import {getRequestScope} from '@toolkit/providers/firebase/server/Handler';

import Auth = admin.auth;
import Firestore = admin.firestore;
import Logger = functions.logger;

/**
 * Callback that app provides to create accounts from users.
 * See [TODO: link to doc]
 */
type AccountToUserCallback = (auth: AuthData) => Promise<User>;

// Global per server for now
let accountToUserCallback: AccountToUserCallback;

export function setAccountToUserCallback(callback: AccountToUserCallback) {
  accountToUserCallback = callback;
}

/**
 * Standard authentication hook
 * - Sets the account data in the request context
 * - Calls app-specific callback to get or create the user
 * - If user exists and canLogin is true, sets the user on the request context
 *   (if not the request is considered to be logged out)
 *
 * May throw for requests with invalid credentials or when relogin is required,
 * as these need type-specific auth errors to be propagated to the client
 */
export async function authenticate(ctx: CallableContext): Promise<User | null> {
  const auth = ctx.auth;
  getRequestScope().set('account', auth);
  getRequestScope().set('user', null);

  if (!auth) {
    return null;
  }

  const user = await accountToUserCallback(auth);
  if (user.canLogin) {
    getRequestScope().set('user', user);
  }
  return user;
}

/**
 * Get the currently logged in user.
 * Can return null
 */
export function getLoggedInUser(): User | null {
  return getRequestScope().get('user');
}

/**
 * Get the underlying Firebase account information. This should generally
 * only be used by infrastructure code in the auth stack - most functions
 * should use the *User() APis.
 */
export function getAccountInfo(): AuthData | null {
  return getRequestScope().get('account');
}

/**
 * Get the underlying Firebase account information. This should generally
 * only be used by infrastructure code in the auth stack - most functions
 * should use the *User() APIs.
 *
 * Throws error if not authenticated
 */
export function requireAccountInfo(): AuthData {
  const account = getAccountInfo();
  if (account == null) {
    // TODO: Create CodedError utilities and use
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You are not authenticated',
    );
  }
  return account;
}

/**
 * Gets the currently logged in user.
 * Throws error when not logged in (will become a NotLoggedInError)
 */
export function requireLoggedInUser(): User {
  const user = getRequestScope().get('user');
  if (user == null) {
    // TODO: Create CodedError utilities and use
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You are not logged in',
    );
  }
  return user;
}

/**
 * Get user emails for allowlist. Emails are stored in a string array
 * in config/allowlist doc in Firestore.
 */
async function getAllowedUserEmails(): Promise<string[]> {
  const allowlist = await Firestore()
    .collection('config')
    .doc('allowlist')
    .get();
  return allowlist.data()!.users;
}

/**
 * Simple email allowlist.
 *
 * Apps will likely need more complex behavior over time and are encouraged
 * to create their own logic for validating users.
 */
export async function checkUserEmailAllowlist(
  authData: AuthData,
): Promise<boolean> {
  const user = authData.token;
  // Bypass `user.emailVerified` check if FB signin for now
  const isFacebookProvider = user.firebase.sign_in_provider === 'facebook';

  const allowedUsers = await getAllowedUserEmails();

  const canLogin =
    user.email != null &&
    allowedUsers.includes(user.email) &&
    (user.email_verified || isFacebookProvider);

  return canLogin;
}
