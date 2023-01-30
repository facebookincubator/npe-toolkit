/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Namespace, createNamespace} from 'cls-hooked';
import * as functions from 'firebase-functions';
import {HttpsFunction, Runnable} from 'firebase-functions';
import {ApiKey} from '@toolkit/core/api/DataApi';
import {Role} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {DEFAULT_FUNCTIONS_REGION} from '@toolkit/providers/firebase/Config';
import {
  authenticate,
  requireLoggedInUser,
} from '@toolkit/providers/firebase/server/Auth';
import * as CommonErrors from '@toolkit/tbd/CommonErrors';

type FirebaseFunction = HttpsFunction & Runnable<any>;
type FirebaseCtx = functions.https.CallableContext;
const scope = createNamespace('request-scope');

/**
 * Middleware must call `next()` to pass execution to the next middleware or handler.
 * Anything before `next()` will run pre-handler (i.e. respData===undefined)
 * and after `next()` will run post-handler.
 */
export type Middleware = (
  ctx: FirebaseCtx,
  reqData: any,
  respData: any,
  next: Function,
  handlerConfig?: HandlerConfig,
) => Promise<any>;

export const AuthenticateMiddleware: Middleware = async (
  ctx: FirebaseCtx,
  _reqData: any,
  _respData: any,
  next: Function,
  _handlerConfig?: HandlerConfig,
) => {
  await authenticate(ctx);
  await next();
};

export const ResultLoggerMiddleware: Middleware = async (
  ctx: FirebaseCtx,
  reqData: any,
  respData: any,
  next: Function,
  _handlerConfig?: HandlerConfig,
) => {
  await next();
  // @ts-ignore This actually works
  functions.logger.log('url', ctx.rawRequest.url);
  functions.logger.log('input:', reqData);
  functions.logger.log('output:', respData);
};

export const RolesCheckMiddleware: Middleware = async (
  _ctx: FirebaseCtx,
  _reqData: any,
  _respData: any,
  next: Function,
  handlerConfig?: HandlerConfig,
) => {
  if (handlerConfig != null && handlerConfig.allowedRoles != null) {
    const user = requireLoggedInUser();
    const roles = user.roles?.roles || [];

    // Check if the user's roles match any of the allowed roles
    const allowed = handlerConfig.allowedRoles.some(role =>
      roles.includes(role),
    );
    if (!allowed) {
      throw CommonErrors.UnauthorizedError(
        "User's roles do not match any allowed roles for this function",
      );
    }
  }

  await next();
};

let middlewares: Middleware[] = [
  ResultLoggerMiddleware,
  AuthenticateMiddleware,
];

export function initMiddlewares(setMiddlewares: Middleware[]) {
  middlewares = setMiddlewares;
}

// Firebase will convert all non-HttpsError errors to a generic `HttpsError{code:'internal' message:'INTERNAL'}`.
// https://firebase.google.com/docs/functions/callable#handle_errors
// This fn returns a new `HttpsError` with `error` converted to `CodedError` and embedded.
const toHttpsError = function (error: Error): functions.https.HttpsError {
  function newHttpsError(
    code: functions.https.FunctionsErrorCode,
    userVisibleMessage: string,
    codedError: CodedError,
  ): functions.https.HttpsError {
    const newError = new functions.https.HttpsError(code, userVisibleMessage, {
      CodedError: codedError,
    });
    // Keep stacktrace
    newError.stack = error.stack;
    return newError;
  }
  if (error instanceof functions.https.HttpsError) {
    const httpsError = error;
    return newHttpsError(
      httpsError.code,
      httpsError.message,
      new CodedError(
        // TODO: map `HttpsError.code` to `CodedError.type`
        httpsError.code,
        httpsError.message,
        typeof httpsError.details === 'string'
          ? httpsError.details
          : JSON.stringify(httpsError.details),
      ),
    );
  }
  if (error instanceof CodedError) {
    const codedError = error as CodedError;
    // TODO:
    // 1. clean up `CodedError` types
    // 2. map `CodedError.type` to `HttpsError.code`
    const [type, subtype] = codedError.type.split('.');
    switch (type) {
      case 'AUTH':
        switch (subtype) {
          case 'INVALID_TOKEN':
          case 'NOT_LOGGED_IN':
          case 'EXPIRED_SESSION':
            return newHttpsError(
              'unauthenticated',
              codedError.userVisibleMessage,
              codedError,
            );
        }
      default:
        return newHttpsError(
          'unknown',
          codedError.userVisibleMessage,
          codedError,
        );
    }
  }
  return newHttpsError(
    'unknown',
    'An unknown error occurred.',
    CommonErrors.GenericError(`${error.name}:${error.message || ''}`),
  );
};

/**
 * Registers a handler and provides common request processing functionality.
 *
 * Currently this is
 * - Setting up scope that allows us to not have to pass around a context object
 * - Running authentiacation handler
 */
export type HandlerConfig = {
  minInstances?: number;
  maxInstances?: number;
  timeoutSecs?: number;
  allowedRoles?: Role[];
  regions?: string[];
};
export function registerHandler<I, O>(
  key: ApiKey<I, O>,
  handler: (data: I) => Promise<O>,
  handlerConfig?: HandlerConfig,
): FirebaseFunction {
  const regions = handlerConfig?.regions ?? [DEFAULT_FUNCTIONS_REGION];

  const options: functions.RuntimeOptions = {
    minInstances: handlerConfig?.minInstances,
    maxInstances: handlerConfig?.maxInstances,
  };

  // Have to add timeout seconds to the object like this.
  // If the `timeoutSeconds` key is set to null it's parsed as
  // as "timeout":"undefineds"
  if (handlerConfig?.timeoutSecs != null) {
    options.timeoutSeconds = handlerConfig.timeoutSecs;
  }

  return functions
    .region(...regions)
    .runWith(options)
    .https.onCall(async (reqData: I, ctx: FirebaseCtx) => {
      return await scope.runPromise(async () => {
        try {
          let respData: O;
          let idx = -1;
          async function next() {
            idx += 1;
            if (idx >= middlewares.length) respData = await handler(reqData);
            else
              await middlewares[idx](
                ctx,
                reqData,
                respData,
                next,
                handlerConfig,
              );
          }
          await next();
          if (idx !== middlewares.length) {
            throw CommonErrors.GenericError(
              `Middleware should call next() once or raise exception. idx: ${idx}`,
            );
          }
          return respData!;
        } catch (e: any) {
          functions.logger.error(e);
          throw toHttpsError(e);
        }
      });
    });
}

/**
 * Gets the request scope
 */
export function getRequestScope(): Namespace {
  return scope;
}
