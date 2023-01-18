/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import CodedError from '@toolkit/core/util/CodedError';

export const UserNotFoundError = (uid: string) =>
  new CodedError(
    'helloworld.notif.invalid_uid',
    'Failed to enable push notifications',
    `User not found for UID ${uid}`,
  );
