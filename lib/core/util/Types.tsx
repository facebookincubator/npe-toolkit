/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

/**
 * Shorthand for Type | null | undefined.
 *
 * Can use in all places where you'd use nullable or undefined,
 * unless you specifically want to allow one but not the other.
 */
export type Opt<T> = T | null | undefined;

/**
 * TypeScript updated typing for catch (e) te reflect that it can be
 * any type of object. This type can be used, and then converted
 * to an error in places where you know it can only be an error that
 * is caught.
 */
export type Catchable = Error | unknown;

/**
 * Extract the keys of T that have value type U. Similar to
 * `keyof` but filtered so the keys have a specific value type.
 *
 * Usage:
 * ```
 * type User = {
 *   email: string;
 *   emailVerified: boolean;
 *   phone: string;
 *   phoneVerified: boolean;
 * }
 *
 * // These are equivalent
 * type UserVerification = KeysOfType<User, boolean>;
 * type UserVerification = "emailVerified" | "phoneVerified";
 * ```
 */
export type KeysOfType<T, U> = NonNullable<{
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T]>;

/**
 * Convert a the results of a caught object to an Error,
 * and throw if it's not convertible.
 *
 * Usage:
 * ```
 *   try {
 *     doSomethingHere();
 *   } catch (e) {
 *     someFunctionThatDisplaysError(toError(e));
 *   }
 * ```
 */
export function toError(e: Catchable): Error {
  const error = e as any;
  if (error?.name && error?.message) {
    return error;
  }
  throw (e);
}
