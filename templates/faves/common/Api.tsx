/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {api} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {Updater} from '@toolkit/data/DataStore';
import {firebaseFn} from '@toolkit/providers/firebase/client/FunctionsApi';
import {Fave, Thing} from './DataTypes';

export const GET_USER = api<void, User>('getUser', firebaseFn);
export const UPDATE_USER = api<Updater<User>, User>('updateUser', firebaseFn);
export const ADD_THING = api<Updater<Thing>, string>('addThing', firebaseFn);

export type ThingID = string;
export const ADD_FAVE = api<ThingID, Fave>('addFave', firebaseFn);
export const SEND_FAVE_NOTIF = api<Fave, void>('sendFaveNotif', firebaseFn);
export const SEND_THING_DELETE_NOTIF = api<string, void>(
  'sendThingDeleteNotif',
  firebaseFn,
);

// Admin panel
type AdminNotifPayload = {user: User; title?: string; body: string};

export const SEND_ADMIN_NOTIF = api<AdminNotifPayload, void>(
  'sendAdminNotif',
  firebaseFn,
);
export const BROADCAST_ADMIN_NOTIF = api<Omit<AdminNotifPayload, 'user'>, void>(
  'broadcastAdminNotif',
  firebaseFn,
);
