/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel} from './model';

export type FilterOp = '==' | '!=' | '<' | '<=' | '>=' | '>' | 'IN' | 'NIN';
export type OrderDirection = 'asc' | 'desc';

export type Query<T extends BaseModel> = {
  filters?: Filter<T>[];
  orders?: Order<T>[];
  limit?: Limit;
  edges?: Edge<T>[];
};

type Key<T extends BaseModel> = string & keyof T;

export type Field<T extends BaseModel> = keyof T | `${Key<T>}.id`;

// TODO: support OR
export type Filter<T extends BaseModel> = {
  field: Field<T>;
  op: FilterOp;
  value: any;
};

export type Order<T extends BaseModel> = {
  field: Field<T>;
  dir?: OrderDirection;
};

export type Limit = {
  size?: number;
  offset?: number;
};

// WIP
export type Edge<T extends BaseModel> = `${Key<T>}` | `${Key<T>}.${string}`;
