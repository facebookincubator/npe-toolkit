/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import NotificationChannel from '@toolkit/services/notifications/NotificationChannel';

export const NOTIF_CHANNELS: Record<string, NotificationChannel> = {
  thingFaved: new NotificationChannel({
    id: 'HAX_APP:THING_FAVED',
    name: 'Faves',
    description:
      "These are notifications for when someone Fave's a Thing you added",
    titleFormat: 'New Fave',
    bodyFormat: '${likerName} faved your thing: "${thingName}"',
    defaultDeliveryMethod: 'PUSH',
  }),

  thingDeleted: new NotificationChannel({
    id: 'HAX_APP:THING_DELETED',
    name: 'Thing Deleted',
    description:
      'These are notifications for when someone deletes a Thing you added',
    titleFormat: 'Thing Deleted',
    bodyFormat: '"${thingName}" has been deleted',
    defaultDeliveryMethod: 'PUSH',
  }),

  admin: new NotificationChannel({
    id: 'HAX_APP:ADMIN',
    name: 'ADMIN',
    description: 'These are one-off notifications from admins',
    titleFormat: '${title}',
    bodyFormat: '${body}',
    defaultDeliveryMethod: 'PUSH',
  }),
};
