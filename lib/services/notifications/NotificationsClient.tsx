/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useDataStore} from '@toolkit/data/DataStore';
import NotificationChannel from '@toolkit/services/notifications/NotificationChannel';
import {
  NotificationPref,
  PushToken,
  StorageToken,
  UserNotifEndpoints,
} from '@toolkit/services/notifications/NotificationTypes';

export const useNotifications = (): NotificationsAPI => {
  const user = requireLoggedInUser();
  const tokenStore = useDataStore(StorageToken);
  const prefsStore = useDataStore(NotificationPref);

  return {
    registerPushToken: async (token): Promise<void> => {
      const id = `${user.id}:${token.token}`;
      const existing = await tokenStore.get(id);

      // Token already registered.
      if (existing != null) {
        return;
      }

      await tokenStore.create({
        id,
        user: {id: user.id},
        ...token,
      });
    },

    unregisterPushToken: async token => {
      const storedToken = await tokenStore.getMany({
        query: {where: [{field: 'token', op: '==', value: token}]},
      });

      // There should only be one if it exists because the key is userId:token
      if (storedToken.length > 0) {
        await tokenStore.remove(storedToken[0].id);
      }
    },

    getNotificationPrefs: async channel => {
      return await prefsStore.get(`${user.id}:${channel.id}`);
    },

    setNotificationPrefs: async (channel, prefs) => {
      const newPrefs = {
        id: `${user.id}:${channel.id}`,
        channelId: channel.id,
        user: {id: user.id},
        deliveryMethods: prefs.deliveryMethods,
        enabled: prefs.enabled,
      };

      const exists = prefsStore.get(`${user.id}:${channel.id}`);
      if (exists == null) {
        return await prefsStore.create(newPrefs);
      } else {
        return await prefsStore.update(newPrefs);
      }
    },
  };
};

/**
 * All methods in this API operate on
 * - The currently logged in user in the client
 * - The user making the request on the server
 *
 * Apps should implement these functions using their user and data models
 * (or just use the FCM implementation built into NPE Toolkit).
 * // TODO: Add links to FCM implementation here and below.
 */
export type NotificationsAPI = {
  /**
   * Register a push token for the logged in user.
   *
   * The token passed here will be converted to a StorageToken and stored
   */
  registerPushToken: (token: PushToken) => Promise<void>;

  /**
   * Invalidate a push token for the logged in user
   */
  unregisterPushToken: (tokenId: string) => Promise<void>;

  /**
   * Get the logged in user's preferred delivery method(s) for a channel.
   *
   * If the user doesn't have any preferences, this should just return
   * the default method for the channel.
   *
   * If the user has disabled this notification, this should return
   * an empty array.
   */
  getNotificationPrefs: (
    channel: NotificationChannel,
  ) => Promise<Opt<NotificationPref>>;

  /**
   * Set the logged in user's preferred delivery methods for a channel.
   * This will override the default delivery method set for a channel.
   */
  setNotificationPrefs: (
    channel: NotificationChannel,
    pref: Pick<NotificationPref, 'deliveryMethods' | 'enabled'>,
  ) => Promise<NotificationPref>;
};

/**
 * This is a server-only API will use an admin or all-powerful VC
 */
export type NotificationsSendAPI = {
  /**
   * Get the list of preferred and valid endpoints where notifications
   * should be sent for the given list of users.
   *
   * If a user has opted out of notifications for this channel,
   * all endpoints will be empty.
   *
   * If a user has opted out of recieving notifications from a specific delivery
   * method for this channel, the endpoints for that method will be empty.
   */
  getPreferredSendDestinations: (
    userIds: string[],
    channel: NotificationChannel,
  ) => Promise<Record<string, UserNotifEndpoints>>;
};
