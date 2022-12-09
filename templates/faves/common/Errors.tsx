/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import CodedError from '@toolkit/core/util/CodedError';

export const UserNotFoundError = (uid: string) =>
  new CodedError(
    'hax-app.notif.invalid_uid',
    'Failed to enable push notifications',
    `User not found for UID ${uid}`,
  );
