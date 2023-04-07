/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from 'axios';
import * as admin from 'firebase-admin';
import {getFirebaseNotificationsSendAPI} from '@toolkit/core/server/Notification';
import {
  NotificationsSender,
  SendPush,
} from '@toolkit/services/notifications/NotificationSender';

/**
 * Send push notifications using FCM via the Firebase Admin API
 *
 * @param fcmTokens FCM Tokens to send the notification to
 * @param title The title of the notification
 * @param body The body of the notification
 * @param data Metadata to include with the notification.
 * @param badge The value of the badge on the home screen app icon.
 *   If not specified, the badge is not changed.
 *   If set to 0, the badge is removed.
 *   Platforms: iOS
 */
export const sendPush: SendPush = async (
  fcmTokens: string[],
  title: string,
  body: string,
  data: Record<string, string> | null,
  badge?: string,
) => {
  // Filter null and undefined tokens
  // Ideally this would never happen, but the entire call to `sendToDevice`
  // fails if even one token is wrong so let's make extra sure here.
  fcmTokens.filter(token => token != null);

  if (fcmTokens.length === 0) {
    return;
  }

  const payload: admin.messaging.MessagingPayload = {
    notification: {
      title,
      body,
    },
  };
  if (badge !== null && badge !== undefined && !isNaN(parseInt(badge))) {
    payload.notification!.badge = badge;
  }

  if (data != null) {
    payload.data = data;
  }

  await admin.messaging().sendToDevice(fcmTokens, payload);
};

export const getSender = () => {
  return NotificationsSender(getFirebaseNotificationsSendAPI(), {
    sendPush,
  });
};

type FCMTokenResp = {
  apns_token: string;
  registration_token: string;
  status: string;
};

const CONVERT_ENDPOINT = 'https://iid.googleapis.com/iid/v1:batchImport';

/**
 * Converts APNs tokens to Firebase Cloud Messaging Tokens.
 * @param bundleId The bundle ID of the app.
 * This should match the bundle ID registered with Firebase.
 * @param fcm_server_key The FCM server key found in the Firebase Console at
 * Project Settings > Cloud Messaging.
 * @param apnsTokens The tokens to convert to FCM tokens.
 * This is limited to 100 tokens.
 * @param sandbox True if you're using a development build. False for production builds
 *
 * @returns A mapping from the input APNs tokens to their corresponding Firebase registration tokens.
 */
export async function apnsToFCMToken(
  bundleId: string,
  fcm_server_key: string,
  apnsTokens: string[],
  sandbox: boolean = false,
): Promise<Record<string, string>> {
  if (apnsTokens.length > 100) {
    throw new Error('Cannot process more than 100 tokens at a time.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `key=${fcm_server_key}`,
  };
  const payload = {
    application: bundleId,
    sandbox,
    apns_tokens: apnsTokens,
  };

  const response = await axios.post(CONVERT_ENDPOINT, payload, {headers});
  const results = response.data.results as FCMTokenResp[];

  return Object.fromEntries(
    results.map(res => {
      return [res.apns_token, res.registration_token];
    }),
  );
}
