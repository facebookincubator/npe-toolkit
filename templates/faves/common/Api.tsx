/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {serverApi} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {Updater} from '@toolkit/data/DataStore';
import {Fave, Thing} from './DataTypes';

export const GET_USER = serverApi<void, User>('getUser');
export const UPDATE_USER = serverApi<Updater<User>, User>('updateUser');
export const ADD_THING = serverApi<Updater<Thing>, string>('addThing');

export type ThingID = string;
export const ADD_FAVE = serverApi<ThingID, Fave>('addFave');
export const SEND_FAVE_NOTIF = serverApi<Fave, void>('sendFaveNotif');
export const SEND_THING_DELETE_NOTIF = serverApi<string, void>(
  'sendThingDeleteNotif',
);

// Admin panel
type AdminNotifPayload = {user: User; title?: string; body: string};

export const SEND_ADMIN_NOTIF = serverApi<AdminNotifPayload, void>(
  'sendAdminNotif',
);
export const BROADCAST_ADMIN_NOTIF = serverApi<
  Omit<AdminNotifPayload, 'user'>,
  void
>('broadcastAdminNotif');
