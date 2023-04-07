/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

/**
 * Promise wrapper that provides isDone() and getValue() methods.
 *
 * Needed for use in async data loading, as you want to throw if the data isn't loaded yet,
 * get the value if it is loaded, and know when a promise is going to throw (by querying isDone())
 * so you can wait for all promises before triggering a throw.
 *
 * Can initialize from:
 * - A Promise
 * - A value (equivalent to Promise.resolve(), and isDone() is immmediately set to true in this case)
 */

class Promised<C> extends Promise<C> {
  promise: Promise<C>;
  isPromiseDone: boolean = false;
  // @ts-ignore
  value: C;
  error: any = null;
  fulfilled: boolean = false;

  // The function alternative here is because promise.then() can (I think) call your original constructor
  // to generate a new promise
  // @ts-ignore
  constructor(from: Promise<C> | Function | C) {
    let resolver: {
      (value: C | PromiseLike<C>): void;
    };
    let rejecter: {(arg0: any): void; (reason?: any): void};

    super((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    let promise: Promise<C>;
    if (typeof from === 'function') {
      // Note: This means we can't create an immeiate Promised from a function yet...
      // @ts-ignore
      promise = new Promise(from);
    } else if (from instanceof Promise) {
      promise = from;
    } else {
      // From is the value for an immediate Promised.
      promise = Promise.resolve(from);
      this.isPromiseDone = true;
      this.fulfilled = true;
      this.value = from;
    }

    this.promise = promise;

    this.promise
      .then((value: C) => {
        this.value = value;
        this.fulfilled = true;
        this.isPromiseDone = true;
        resolver(value);
      })
      .catch(error => {
        this.error = error;
        this.isPromiseDone = true;
        rejecter(error);
      });
  }

  // Throws when promise isn't resolved yet
  // Throws when promise rejected
  getValue(): C {
    if (!this.isPromiseDone) {
      throw this;
    }

    if (!this.fulfilled) {
      throw this.error;
    }

    return this.value;
  }

  isDone(): boolean {
    return this.isPromiseDone;
  }

  getError(): any {
    return this.error;
  }
}

// Utility type for APIs that want to accept either a or a Promise<T>.
export type Promisable<T> = T | Promise<T> | Promised<T>;

export default Promised;
