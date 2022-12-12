/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import type {Type} from './schema';
import {isArrayType} from './schema';

/** @ts-ignore */
export const IS_JEST_TEST = process.env.JEST_WORKER_ID !== undefined;

export type ID = string;
export type Opt<T> = T | null | undefined;
export type Success = boolean;
export type OptionalId<T> = Omit<T, 'id'> & {id?: ID};
export type RequireOnlyId<T> = Partial<T> & {id: ID};

export function isInPrototypeChain(childPrototype: any, parentPrototype: any) {
  let c = childPrototype;
  while (c) {
    if (c === parentPrototype) {
      return true;
    }
    c = Object.getPrototypeOf(c);
  }
  return false;
}

export function getElementType(type: Type): Type {
  const isArray = isArrayType(type);
  // @ts-ignore
  return isArray ? type.getElementType() : type;
}
