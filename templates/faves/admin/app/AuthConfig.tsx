/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import firebase from 'firebase';
import {Account} from '@toolkit/core/api/Auth';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import {FirebaseAuthService} from '@toolkit/providers/firebase/client/AuthService';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {UnauthorizedError} from '@toolkit/tbd/CommonErrors';
import {GET_USER} from '@app/common/Api';

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
      !(user.roles.roles.includes('ADMIN') || user.roles.roles.includes('DEV'))
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
