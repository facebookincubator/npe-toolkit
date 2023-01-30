/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import NotificationChannel from '@toolkit/services/notifications/NotificationChannel';
import {NotificationsSendAPI} from '@toolkit/services/notifications/NotificationsClient';
import {UnsupportedNotifMethodError} from '@toolkit/tbd/CommonErrors';

/**
 * Send a push notification to the given push tokens.
 * Use the `data` arg to include metadata that tells the client
 * how to handle the notification.
 *
 * @param pushTokens The push tokens to deliver the notification to
 * @param title The push notification title
 * @param body The push notification message
 * @param data Any metadata that should be included in the push notification
 * @param badge The value of the badge on the home screen app icon.
 *   If not specified, the badge is not changed.
 *   If set to 0, the badge is removed.
 *   Platforms: iOS

 */
export type SendPush = (
  pushTokens: string[],
  title: string,
  body: string,
  data: Record<string, string> | null,
  badge?: string,
) => Promise<void>;

/**
 * Send an email to the given emails
 *
 * @param emailAddress The email addresses to send this email to
 * @param subject The subject of the email
 * @param body The body of the email
 */
export type SendEmail = (
  emailAddresses: string[],
  subject: string,
  body: string,
) => Promise<void>;

/**
 * Sends a text message to the given phone numbers
 *
 * @param phoneNumber The phone numbers to send the text to
 * @param text The text of the SMS message
 */
export type SendSMS = (phoneNumbers: string[], text: string) => Promise<void>;

/**
 * A configuration object to store functions that send pushes, emails, or SMS
 */
export type NotificationsProvider = {
  sendPush?: SendPush;
  sendEmail?: SendEmail;
  sendSMS?: SendSMS;
};

/**
 * Configures a notification sender
 *
 * @param notifConfig a NotificationsConfig object
 * @param sendConfig a SendNotificationConfig object
 * @returns A notifications send function
 */
export const NotificationsSender = (
  notifSendAPI: NotificationsSendAPI,
  provider: NotificationsProvider,
) => {
  const {getPreferredSendDestinations} = notifSendAPI;
  const {sendPush, sendEmail, sendSMS} = provider;

  /**
   * Send a notification by the user's preferred method.
   *
   * @param userIds The user IDs to send this notification to.
   * @param channel The NotificationChannel for this notification
   * @param titleParams Parameters that should be used to fill in the title
   * @param bodyParams Parameters that should be used to fill in the body
   * @param data [Push only] Any metadata that should be included
   */
  return async (
    userIds: string | string[],
    channel: NotificationChannel,
    titleParams: Record<string, string> | null = null,
    bodyParams: Record<string, string> | null = null,
    data: Record<string, string> | null = null,
    badge?: string,
  ) => {
    const title = channel.getTitle(titleParams);
    const body = channel.getBody(bodyParams);
    const recipientIds = Array.isArray(userIds) ? userIds : [userIds];

    // Get all valid endpoints for all recipients
    const endpoints = await getPreferredSendDestinations(recipientIds, channel);

    // For every recipient, send to all available endpoints
    const sendPromises = recipientIds.map(async recipientId => {
      const userEndpoints = endpoints[recipientId];
      if (userEndpoints.pushTokens.length > 0) {
        if (sendPush == null) {
          throw UnsupportedNotifMethodError(
            'Push sender not configured in NotificationsProvider',
          );
        }
        await sendPush(userEndpoints.pushTokens, title, body, data, badge);
      }

      if (userEndpoints.emails.length > 0) {
        if (sendEmail == null) {
          throw UnsupportedNotifMethodError(
            'Email sender not configured in NotificationsProvider',
          );
        }

        await sendEmail(userEndpoints.emails, title, body);
      }

      if (userEndpoints.phoneNumbers.length > 0) {
        if (sendSMS == null) {
          throw UnsupportedNotifMethodError(
            'SMS sender not configured in NotificationsProvider',
          );
        }

        await sendSMS(userEndpoints.phoneNumbers, title + '\n' + body);
      }
    });

    await Promise.all(sendPromises);
  };
};
