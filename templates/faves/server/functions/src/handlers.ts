/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {AuthData} from 'firebase-functions/lib/common/providers/https';
import {Profile, User, UserRoles} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Updater} from '@toolkit/data/DataStore';
import {
  FirestoreContext,
  firebaseStore,
} from '@toolkit/providers/firebase/DataStore';
import {getInstanceFor} from '@toolkit/providers/firebase/Instance';
import {
  requireAccountInfo,
  requireLoggedInUser,
  setAccountToUserCallback,
} from '@toolkit/providers/firebase/server/Auth';
import {getAppConfig} from '@toolkit/providers/firebase/server/Config';
import {
  getAdminDataStore,
  getDataStore,
} from '@toolkit/providers/firebase/server/Firestore';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {
  apnsToFCMToken,
  getSender,
} from '@toolkit/providers/firebase/server/PushNotifications';
import {getAllowlistMatchedRoles} from '@toolkit/providers/firebase/server/Roles';
import {
  ADD_FAVE,
  ADD_THING,
  BROADCAST_ADMIN_NOTIF,
  GET_USER,
  SEND_ADMIN_NOTIF,
  SEND_FAVE_NOTIF,
  SEND_THING_DELETE_NOTIF,
  UPDATE_USER,
} from '@app/common/Api';
import {Fave, PROFILE_FIELDS, Thing} from '@app/common/DataTypes';
import {NOTIF_CHANNELS} from '@app/common/NotifChannels';

const {defineSecret} = require('firebase-functions/params');

const instance = getInstanceFor(getAppConfig());

const notificationApiKey = defineSecret('fcm.server_key');

/**
 * Convert Firebase Auth account to User
 */
async function accountToUser(auth: AuthData): Promise<User> {
  // TODO: Make `firestore` role-based (e.g. firestoreForRole('ACCOUNT_CREATOR'))
  // @ts-ignore
  const users = await getDataStore(User);
  const user = await users.get(auth.uid);
  if (user != null) {
    user.canLogin = true;
    return user;
  }

  // If the user matches any role, make them a user.
  const roles = await getAllowlistMatchedRoles(auth);
  if (roles.length === 0) {
    throw new CodedError('AUTH.ERROR', 'You are not in allowlist');
  }

  const newUser: User = {
    id: auth.uid,
    name:
      auth.token?.name ||
      auth.token?.email ||
      auth.token?.phone_number ||
      'No Name',
    canLogin: true,
  };

  if (auth.token?.picture != null) {
    newUser.pic = auth.token.picture;
  }

  if (auth.token?.email != null) {
    newUser.email = auth.token.email;
  }

  const newProfile: Profile = {
    id: newUser.id,
    user: newUser,
    name: newUser.name,
  };
  PROFILE_FIELDS.forEach(pField => {
    if (pField in newUser) {
      // @ts-ignore
      newProfile[pField] = newUser[pField];
    }
  });

  const adminFirestore = admin.firestore();

  await adminFirestore.runTransaction(async (transaction: any) => {
    const ctx: FirestoreContext = {
      /** @ts-ignore Server and client types can be used interchangably in datastore  */
      firestore: adminFirestore,
      firestoreTxn: transaction,
      instance,
    };
    const userStoreInTxn = firebaseStore(User, ctx);
    const profileStoreInTxn = firebaseStore(Profile, ctx);
    const rolesStoreInTxn = firebaseStore(UserRoles, ctx);

    userStoreInTxn.create({...newUser, roles: {id: newUser.id}});
    profileStoreInTxn.create(newProfile);
    rolesStoreInTxn.create({roles, id: newUser.id});
  });

  const createdUser = await users.get(newUser.id, {edges: [UserRoles]});
  createdUser && (createdUser.canLogin = true);
  return createdUser!;
}
setAccountToUserCallback(accountToUser);

export const convertPushToken = functions.firestore
  .document('instance/haxapp/push_tokens/{token}')
  .onCreate(async (change, context) => {
    if (change.get('type') !== 'ios') {
      return;
    }

    const apnsToken = change.get('token');
    functions.logger.debug('Converting token: ', apnsToken);
    const fcmTokenResp = Object.values(
      await apnsToFCMToken(
        change.get('sandbox')
          ? 'com.npetoolkit.helloworld'
          : 'com.npetoolkit.helloworld',
        notificationApiKey.value(),
        [apnsToken],
        change.get('sandbox'),
      ),
    );
    if (fcmTokenResp.length !== 1) {
      throw new Error('Unexpected response when converting APNs token to FCM');
    }
    const fcmToken = fcmTokenResp[0];
    functions.logger.debug('Got FCM Token: ', fcmToken);

    return change.ref.set({fcmToken}, {merge: true});
  });

export const sendFaveNotif = registerHandler(
  SEND_FAVE_NOTIF,
  async (fave: Fave) => {
    const user = requireLoggedInUser();
    const channel = NOTIF_CHANNELS.thingFaved;
    const send = getSender();
    await send(
      user.id,
      channel,
      {},
      {
        likerName: fave.user.name,
        thingName: fave.thing.name,
      },
    );
  },
);

export const sendThingDeleteNotif = registerHandler(
  SEND_THING_DELETE_NOTIF,
  async (thingName: string) => {
    const user = requireLoggedInUser();
    const channel = NOTIF_CHANNELS.thingDeleted;
    const send = getSender();
    await send(
      user.id,
      channel,
      {},
      {
        thingName,
      },
    );
  },
);

export const getUser = registerHandler(GET_USER, async () => {
  const account = requireAccountInfo();
  const store = await getDataStore(User);
  const user = await store.get(account.uid, {edges: [UserRoles]});
  if (user) {
    user.canLogin = true;
  }
  return user;
});

export const updateUser = registerHandler(
  UPDATE_USER,
  async (values: Updater<User>) => {
    const user = requireLoggedInUser();
    // This should be also checked by firestore rules so could remove
    if (values.id != user.id) {
      // TODO: coded typed error
      throw new Error('Not allowed');
    }
    const firestore = admin.firestore();
    await firestore.runTransaction(async (transaction: any) => {
      const ctx: FirestoreContext = {
        /** @ts-ignore Server and client types can be used interchangably in datastore  */
        firestore: adminFirestore,
        firestoreTxn: transaction,
        instance,
      };
      const userStoreInTxn = firebaseStore(User, ctx);
      const profileStoreInTxn = firebaseStore(Profile, ctx);
      const profileValues: Updater<Profile> = {id: user.id, user: user};
      PROFILE_FIELDS.forEach(pField => {
        if (pField in values) {
          // @ts-ignore
          profileValues[pField] = values[pField];
        }
      });
      userStoreInTxn.update(values);
      profileStoreInTxn.update(profileValues);
    });
    const store = await getDataStore(User);
    return store.get(values.id);
  },
);

export const addThing = registerHandler(ADD_THING, async data => {
  requireLoggedInUser();
  const thingStore = await getDataStore(Thing);
  const newFave = await thingStore.create(data);
  return newFave.id;
});

export const addFave = registerHandler(ADD_FAVE, async (thingId: string) => {
  const uid = requireLoggedInUser().id;
  const userStore = await getDataStore(User);
  const thingStore = await getDataStore(Thing);
  const faveStore = await getDataStore(Fave);

  // This should never be undefined because of the call to requireLoggedInUser
  const user = (await userStore.get(uid, {edges: [Thing]}))!;

  // Make sure the thing exists
  const thing = await thingStore.get(thingId);
  if (!thing) {
    // TODO: Throw coded error
    throw Error(`Thing with ID ${thingId} does not exist`);
  }

  // Check if this fave already exists
  const existing = await faveStore.getMany({
    query: {
      where: [
        {field: 'user', op: '==', value: uid},
        {field: 'thing', op: '==', value: thingId},
      ],
    },
  });
  if (existing.length > 0) {
    return existing[0];
  }

  // Create a fave
  const fave = await faveStore.create({
    user,
    thing,
  });

  return fave;
});

export const sendAdminNotif = registerHandler(
  SEND_ADMIN_NOTIF,
  async ({user, title, body}) => {
    const channel = NOTIF_CHANNELS.admin;
    const send = getSender();
    await send(user.id, channel, {title: title != null ? title : ''}, {body});
  },
  {allowedRoles: ['admin']},
);

export const broadcastAdminNotif = registerHandler(
  BROADCAST_ADMIN_NOTIF,
  async ({title = '', body}) => {
    const channel = NOTIF_CHANNELS.admin;
    const userStore = await getAdminDataStore(User);
    const allUsers = await userStore.getAll();
    const send = getSender();

    await Promise.all(
      allUsers.map(user => send(user.id, channel, {title}, {body})),
    );
  },
  {allowedRoles: ['admin']},
);
