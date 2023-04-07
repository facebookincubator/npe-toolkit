/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Error with a unique type and a user visible message.
 *
 * Use the userVisibleMessage for any strings that will be visible
 * to real end users - other error messages and stack trace will
 * only be shown in developer builds.
 */
export class CodedError extends Error {
  // Unique type of the error
  // Not using an official way to reserve names,
  // so use a unique-ish namespace (e.g. AUTH.EXPIRED)
  type: string;
  // User visible message
  userVisibleMessage: string;
  // Developer friendly message (when available)
  devMessage: string | null;

  constructor(type: string, userVisibleMessage: string, devMessage?: string) {
    const devMsg = devMessage != null ? devMessage : userVisibleMessage;
    super(devMsg);
    this.type = type;
    this.userVisibleMessage = userVisibleMessage;
    this.devMessage = devMsg;
  }
}

interface HasType {
  type: string;
}
export type CodedErrorType = ((devMsg?: string) => CodedError) & HasType;

export function CodedErrorFor(
  type: string,
  userVisibleMessage: string,
): CodedErrorType {
  const errorFn = (devMsg?: string) =>
    new CodedError(type, userVisibleMessage, devMsg);
  errorFn.type = type;
  return errorFn;
}

export function isErrorType(e: any, codedErrorType: {type: string}) {
  return e instanceof CodedError && e.type === codedErrorType.type;
}

const DEFAULT_ERROR_TEXT = 'Unknown failure';

/**
 * Utility to get a user visible message from any error.
 * If it's a `CodedError`, it will get a useful message from the
 * error, otherwise gets the default.
 *
 * `error` parameter is generally an Error but allwows any type because
 * it is frequently invoked by catch block which can catch any type of
 * variable. For non-error params and for Errors that aren't CodedErrors,
 * it will display the default error message.
 */
export function toUserMessage(error: any, defaultText?: string) {
  return error instanceof CodedError
    ? error.userVisibleMessage
    : defaultText ?? DEFAULT_ERROR_TEXT;
}
