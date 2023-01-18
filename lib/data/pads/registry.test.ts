/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';

import {BaseModel, Field, Model, ModelUtil} from './model';
import registry, {initRegistry} from './registry';
import {RepoMongo} from './repo';

@Model()
class A extends BaseModel {
  @Field()
  n: number;
  @Field()
  s: string;
}

@Model()
class B extends BaseModel {
  @Field()
  n: number;
  @Field()
  s: string;
}

beforeAll(() => {
  initRegistry(RepoMongo);
});

test('model registered and found', () => {
  registry.register(A, B);
  expect(registry.getModel(ModelUtil.getName(A))).toBe(A);
  expect(registry.getModel(ModelUtil.getName(B))).toBe(B);
  expect(registry.getRepo(A)).toBeDefined();
  expect(registry.getRepo(B)).toBeDefined();
  expect(registry.getAllModels()).toContain(A);
  expect(registry.getAllModels()).toContain(B);
});
