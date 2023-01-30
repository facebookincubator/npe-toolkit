/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, DeletedByTTL, ModelUtil} from '@toolkit/data/pads/model';
import {
  RepoMongo,
  RunWithTransactionCallback,
  Transaction,
  runWithMongoTransaction,
} from '@toolkit/data/pads/repo';
import type {OptionalId, Success} from '@toolkit/data/pads/utils';
import {DELETED, REASON_ROOT, TODELETE} from './deletion';

export class RepoMongoWithDeletion<T extends BaseModel> extends RepoMongo<T> {
  static async runWithTransaction(
    fn: RunWithTransactionCallback<unknown>,
  ): Promise<ReturnType<typeof fn>> {
    return runWithMongoTransaction(fn);
  }

  async create(this: RepoMongoWithDeletion<T>, m: OptionalId<T>): Promise<T> {
    const TODELETE_REPO = new RepoMongo(TODELETE);

    const modelName = ModelUtil.getName(this.modelClass);
    const deleteRules = ModelUtil.getDeletionRules(this.modelClass);
    const ttlRule = deleteRules?.find(
      rule => rule.trigger === 'TTL',
    ) as DeletedByTTL;

    if (!ttlRule) {
      return await super.create(m);
    } else {
      // @ts-ignore
      return await this.constructor.runWithTransaction(
        async (txn: Transaction) => {
          const mCreated = await super.useTransaction(txn).create(m);
          await TODELETE_REPO.useTransaction(txn).create({
            id: TODELETE.genId(modelName, mCreated.id),
            modelId: mCreated.id,
            modelName: modelName,
            deleteAt: mCreated.createdAt! + ttlRule.ttlInSecs * 1000,
            status: 'INIT',
          });
          return mCreated;
        },
      );
    }
  }

  async delete(this: RepoMongoWithDeletion<T>, id: string): Promise<Success> {
    const modelName = ModelUtil.getName(this.modelClass);
    if (
      // DELETED and TODELETE are leaf nodes.
      // There should be no edge-based deletion triggers and we don't care about backup/restore.
      modelName === ModelUtil.getName(DELETED) ||
      modelName === ModelUtil.getName(TODELETE)
    ) {
      return await super.delete(id);
    }

    const DELETED_REPO = new RepoMongoWithDeletion(DELETED);
    // @ts-ignore
    return await this.constructor.runWithTransaction(
      async (txn: Transaction) => {
        const mFound = await this.useTransaction(txn).get(id);
        if (!mFound) {
          return true;
        }
        const modelName = ModelUtil.getName(this.modelClass);
        const r = await super.useTransaction(txn).delete(id);
        if (!r) {
          throw new Error(`Failed to delete ${modelName}:${id}`);
        }
        await DELETED_REPO.useTransaction(txn).create({
          id: DELETED.genId(modelName, id),
          modelId: id,
          modelName: modelName,
          // @ts-ignore
          modelData: modelClass._toRawData(mFound),
          reasons: [REASON_ROOT],
          status: 'INIT',
        });
        return r;
      },
    );
  }
}
