/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {createApiKey} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {Updater} from '@toolkit/data/DataStore';
import {Fave, Thing} from './DataTypes';

export type ThingID = string;
export const GET_USER = createApiKey<void, User>('getUser');
export const UPDATE_USER = createApiKey<Updater<User>, User>('updateUser');
export const ADD_THING = createApiKey<Partial<Thing>, string>('addThing');
export const ADD_FAVE = createApiKey<ThingID, Fave>('addFave');
export const SEND_FAVE_NOTIF = createApiKey<Fave, void>('sendFaveNotif');
export const SEND_THING_DELETE_NOTIF = createApiKey<string, void>(
  'sendThingDeleteNotif',
);

// Admin panel
type AdminNotifPayload = {user: User; title?: string; body: string};
export const SEND_ADMIN_NOTIF = createApiKey<AdminNotifPayload, void>(
  'sendAdminNotif',
);

export const BROADCAST_ADMIN_NOTIF = createApiKey<
  Omit<AdminNotifPayload, 'user'>,
  void
>('broadcastAdminNotif');
