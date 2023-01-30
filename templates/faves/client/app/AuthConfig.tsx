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
import {Profile, User} from '@toolkit/core/api/User';
import {DataStore, useDataStore} from '@toolkit/data/DataStore';
import {FirebaseAuthService} from '@toolkit/providers/firebase/client/AuthService';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {GET_USER} from '@app/common/Api';
import {PROFILE_FIELDS} from '@app/common/DataTypes';

/**
 * For early development, it is convenient to create users on the client using Firestore APIs.
 *
 * For launch you'll need to switch this to true and use a server-side call.
 */
const CREATE_USERS_ON_SERVER = false;

export default function AuthConfig(props: {children?: React.ReactNode}) {
  const getUser = useApi(GET_USER);
  const users = useDataStore(User);
  const profiles = useDataStore(Profile);

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

    if (CREATE_USERS_ON_SERVER) {
      return await getUser();
    } else {
      return getOrCreateUser(firebaseAccount, users, profiles);
    }
  };

  return (
    <FirebaseAuthService userCallback={userCallback}>
      {props.children}
    </FirebaseAuthService>
  );
}

/**
 * Client version of creating user - this is for early development,
 * should switch to a server-based version for launch
 * @param firebaseAccount
 * @param userStore
 * @param profileStore
 */
async function getOrCreateUser(
  firebaseAccount: firebase.User,
  userStore: DataStore<User>,
  profileStore: DataStore<Profile>,
) {
  const userId = firebaseAccount.uid;
  const user = await userStore.get(userId);
  const profile = await profileStore.get(userId);
  if (user != null && profile != null) {
    return user;
  }

  const name =
    firebaseAccount.displayName ||
    firebaseAccount.email ||
    firebaseAccount.phoneNumber ||
    'No Name';

  const newUser: User = {
    id: userId,
    name,
    pic: firebaseAccount.photoURL || undefined,
    email: firebaseAccount.email || undefined,
    // Let's everyone in. Don't do this in real apps.
    canLogin: true,
  };

  const newProfile: Profile = {id: userId, user: newUser, name};
  PROFILE_FIELDS.forEach(pField => {
    if (pField in newUser) {
      // @ts-ignore
      newProfile[pField] = newUser[pField];
    }
  });

  // We have an example of doing this in a transaction (in server code)
  // but for simplicity, make two create calls.
  if (profile == null) {
    await profileStore.create(newProfile);
  } else {
    await profileStore.update(newProfile);
  }

  if (user == null) {
    return await userStore.create(newUser);
  } else {
    return user;
  }
}
