/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CodedErrorFor, CodedErrorType} from '@toolkit/core/util/CodedError';

export const ExpiredSessionAuthError: CodedErrorType = CodedErrorFor(
  'AUTH.EXPIRED_SESSION',
  'Your session has expired - please log in again.',
);

// TODO: Remove first error code after switching over server
export const INVALID_TOKEN_OLD = 'INVALID_TOKEN';
export const INVALID_TOKEN = 'AUTH.INVALID_TOKEN';

export const NotLoggedInError: CodedErrorType = CodedErrorFor(
  'AUTH.NOT_LOGGED_IN',
  'You need to be logged in to make this request.',
);

export const UserNotFoundError: CodedErrorType = CodedErrorFor(
  'AUTH.USER_NOT_FOUND',
  'This user could not be found',
);

export const GenericAuthError: CodedErrorType = CodedErrorFor(
  'AUTH.ERROR',
  'An unknown error occurred accessing your account',
);

export const UnsupportedNotifMethodError: CodedErrorType = CodedErrorFor(
  'NOTIFICATIONS.UNSUPPORTED_METHOD',
  'An unknown error ocurred',
);

export const UnauthorizedError: CodedErrorType = CodedErrorFor(
  'SERVER.UNAUTHORIZED',
  'You are not authorized to perform this action',
);

export const GenericError: CodedErrorType = CodedErrorFor(
  'ERROR.GENERIC',
  'An unknown error occurred.',
);

export const NotFoundError: CodedErrorType = CodedErrorFor(
  'ERROR.NOT_FOUND',
  'Resource could not be found',
);
