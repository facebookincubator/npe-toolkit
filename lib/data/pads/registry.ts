/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, ModelClass, ModelUtil} from './model';
import {Repo} from './repo';
import {isJsModelType} from './schema';

type RepoImpl = new (...params: any[]) => Repo<any>;

// Make it possible to work with various Repo implementations.
// Must be set for all Models and can't mix and match.
let _repoImpl: RepoImpl;
export function initRegistry(repoImpl: RepoImpl) {
  if (repoImpl) _repoImpl = repoImpl;
}

export function getRepoImpl(): RepoImpl {
  if (!_repoImpl) throw new Error('Registry not initialized');
  return _repoImpl;
}

const registry = (function () {
  const _models: Map<string, ModelClass<any>> = new Map();

  return {
    register: function <T extends BaseModel>(
      ...mClasses: ModelClass<T>[]
    ): void {
      for (const mClass of mClasses) {
        const mName = ModelUtil.getName(mClass);
        // Too noisy. Just overwrite.
        // if (_models.has(mName) && !IS_JEST_TEST) {
        //   console.log(
        //     `Name "${mName}" is already registered with ${
        //       _models.get(mName)?.name
        //     }. Overwriting it with ${mClass.name}.`,
        //   );
        // }
        _models.set(mName, mClass);
      }
    },
    getModel: function <T extends BaseModel>(mName: string): ModelClass<T> {
      const mClass = _models.get(mName);
      if (!mClass) {
        throw new Error(`Model "${mName}" not registered`);
      }
      return mClass;
    },
    getAllModels: function (): ModelClass<any>[] {
      return Array.from(_models.values());
    },
    // Return a clean repo (no ctx, no transaction, etc)
    getRepo: function <T extends BaseModel>(
      mNameOrClass: string | ModelClass<T>,
    ): Repo<T> {
      if (!_repoImpl) throw new Error('Registry not initialized');
      const mName = isJsModelType(mNameOrClass)
        ? ModelUtil.getName(mNameOrClass as ModelClass<T>)
        : (mNameOrClass as string);

      const mClass = this.getModel(mName);
      if (!mClass) {
        throw new Error(`Model "${mName}" not registered`);
      }
      // TODO: cache
      return new _repoImpl(mClass);
    },
    clear(): void {
      _models.clear();
    },
  };
})();

export default registry;
