/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React from 'react';
import firebase from 'firebase';

import {Account} from '@npe/lib/auth/AuthService';
import {FirebaseAuthService} from '@npe/lib/firebase/FirebaseAuthService';
import {useApi} from '@npe/lib/firebase/FirebaseFunctionsProvider';

import {GET_USER} from 'hax-app-common/Api';
import Role from '@npe/lib/core/Role';
import {UnauthorizedError} from '@npe/lib/util/CommonErrors';
import {useUserMessaging} from '@npe/lib/ui/UserMessaging';

export default function AuthConfig(props: {children?: React.ReactNode}) {
  const getUser = useApi(GET_USER);
  const msg = useUserMessaging();

  /**
   * Use this method to create an instance of your app's user when they log in.
   */
  const userCallback = async (
    account: Account,
    firebaseAccount: firebase.User,
  ) => {
    if (
      firebaseAccount == null ||
      firebaseAccount.uid !== account.id ||
      (firebaseAccount.email == null && firebaseAccount.phoneNumber == null)
    ) {
      throw Error('Invalid account for login');
    }

    const user = await getUser();
    // If the user doesn't have roles set or if the user isn't an admin or dev, reject login
    if (
      user.roles == null ||
      !(
        user.roles.roles.includes(Role.ADMIN) ||
        user.roles.roles.includes(Role.DEV)
      )
    ) {
      const err = UnauthorizedError(
        "User's roles do not match any allowed roles for this function",
      );
      msg.showError(err);
      throw err;
    }

    return user;
  };

  return (
    <FirebaseAuthService userCallback={userCallback}>
      {props.children}
    </FirebaseAuthService>
  );
}
