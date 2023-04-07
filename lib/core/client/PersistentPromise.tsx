/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';

/**
 * A settable promise that is stored in a `React.useRef()`.
 *
 * Allows components to return promises from their API calls that will persist across component renders.
 * e.g. If you have a dialog that returns a yes/no value, you can expose an API that returns Promise<boolean>
 * and is set when the user interacts with the dialog.
 *
 * TODO(add simple example)
 */
export function usePersistentPromise<T>(): {
  resolve: (t: T) => void;
  reject: (error: Error) => void;
  newPromise: () => Promise<T>;
} {
  const resolver = React.useRef<((t: T) => void) | null>();
  const rejecter = React.useRef<((error: Error) => void) | null>();

  function cleanUp() {
    // TODO: Consider making error string settable by clients
    reject(new Error('Promise never resolved'));
    resolver.current = null;
    rejecter.current = null;
  }

  function reject(e: Error) {
    rejecter.current && rejecter.current(e);
  }

  function resolve(value: T) {
    resolver.current && resolver.current(value);
  }

  function newPromise(): Promise<T> {
    cleanUp();
    return new Promise<T>((res, rej) => {
      resolver.current = res;
      rejecter.current = rej;
    });
  }

  return {
    resolve,
    reject,
    newPromise,
  };
}
