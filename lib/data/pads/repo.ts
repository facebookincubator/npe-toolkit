/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  Filter as MongoFilter,
  ModifyResult,
  MongoError,
  OptionalUnlessRequiredId,
  WithId,
} from 'mongodb';
import {Collection, Db, MongoClient, ObjectId} from 'mongodb';
import {Context} from './context';
import {BaseModel, ModelClass, ModelUtil} from './model';
import type {Opt, OptionalId, RequireOnlyId, Success} from './utils';

import type {
  Edge,
  Field,
  Filter,
  FilterOp,
  Limit,
  Order,
  OrderDirection,
  Query,
} from './query';
import {isArrayType, isInverseModelRefType, isModelRefType} from './schema';

type ModelRawData<T extends BaseModel> = {[key in keyof T]?: any};
type ModelRawDataWithoutId<T extends BaseModel> = Omit<ModelRawData<T>, 'id'>;
type MongofiedModelRawData<T extends BaseModel> = ModelRawDataWithoutId<T> & {
  _id?: string;
};

let _client: MongoClient;
let _db: Db;

// TODO
export async function initDb(uri: string, dbName: string): Promise<Db> {
  _client = new MongoClient(
    uri ||
      'mongodb://127.0.0.1:27017/?readPreference=primary&directConnection=true&retryWrites=true&ssl=false',
  );
  await _client.connect();
  // return client.db(dbName);
  _db = _client.db(dbName || 'pads');
  return _db;
}

// WIP
export type Transaction = any;
export type RunWithTransactionCallback<T = void> = (
  transaction: Transaction,
) => Promise<T>;

const runWithMongoTransaction = async (
  fn: RunWithTransactionCallback<unknown>,
): Promise<ReturnType<typeof fn>> => {
  // TODO: Transaction options (e.g. retryCount)
  async function runWithRetries(retry: number): Promise<ReturnType<typeof fn>> {
    const session = _client.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      // If `TransientTransactionError`, retry
      if (
        err instanceof MongoError &&
        err.hasErrorLabel('TransientTransactionError') &&
        retry >= 0
      ) {
        return await runWithRetries(retry - 1);
      } else {
        throw err;
      }
    } finally {
      await session.endSession();
    }
  }
  return await runWithRetries(3);
};

export interface Repo<T extends BaseModel> {
  create(m: OptionalId<T>): Promise<T>;
  get(id: string, edges?: Edge<T>[]): Promise<Opt<T>>;
  query(q?: Query<T>): RepoQuery<T>;
  delete(id: string): Promise<Success>;
  update(m: RequireOnlyId<T>): Promise<T>;
  useTransaction(txn: Transaction): Repo<T>;
  useContext(ctx: Context): Repo<T>;
  // inTransaction(): boolean;
  // getContext(): Opt<Context>;
}

export interface RepoQuery<T extends BaseModel> {
  filter(field: keyof T, op: FilterOp, value: any): this;
  order(field: keyof T, dir: OrderDirection): this;
  limit(limit: number, offset?: number): this;
  run(edges?: Edge<T>[]): Promise<T[]>;
}
export type RepoOptions = {
  ctx?: Context;
  transaction?: Transaction;
};

export class RepoMongo<T extends BaseModel> implements Repo<T> {
  protected _collection: Collection<MongofiedModelRawData<T>> | undefined;
  protected readonly modelClass: ModelClass<T>;
  protected readonly options: RepoOptions;

  static async runWithTransaction(
    fn: RunWithTransactionCallback<unknown>,
  ): Promise<ReturnType<typeof fn>> {
    return runWithMongoTransaction(fn);
  }

  constructor(mClass: ModelClass<T>, options?: RepoOptions) {
    this.modelClass = mClass;
    this.options = options ?? {};
  }

  // TODO: undo once DB init is refactored
  get collection() {
    if (this._collection) return this._collection;
    // @ts-ignore
    const name = ModelUtil.getName(this.modelClass);
    return (this._collection = _db.collection<MongofiedModelRawData<T>>(name));
  }
  useContext(ctx: Context) {
    return new RepoMongo<T>(this.modelClass, {
      ...this.options,
      ctx,
    });
  }

  useTransaction(txn: Transaction) {
    return new RepoMongo<T>(this.modelClass, {
      ...this.options,
      transaction: txn,
    });
  }

  async create(m: OptionalId<T>): Promise<T> {
    const now = Date.now();
    // @ts-ignore
    const mRaw: ModelRawData<T> = this.modelClass._toRawData(m);
    if (!mRaw.id) mRaw.id = this.newId();
    mRaw.createdAt = mRaw.createdAt ?? now;
    mRaw.updatedAt = mRaw.updatedAt ?? now;
    // TODO: other fields: schemaVersion, owner, etc
    // mRaw.uid = this.options?.ctx?.uid ?? undefined;
    const doc = this.toMongoDoc(mRaw) as OptionalUnlessRequiredId<
      MongofiedModelRawData<T>
    >;
    const result = await this.collection.insertOne(doc, {
      session: this.options?.transaction,
    });
    // @ts-ignore
    if (result.acknowledged) return this.toModel(doc)!;
    //TODO: typed error
    else throw Error('create failed');
  }

  async getMany(query: Query<T>): Promise<T[]> {
    const filters = {};
    query.filters?.forEach(f => {
      if (f.field === 'id') {
        // @ts-ignore
        filters['_id'] = {
          [this.opToMongoOp(f.op)]: f.value,
        };
      } else {
        // @ts-ignore
        filters[f.field] = {
          [this.opToMongoOp(f.op)]: f.value,
        };
      }
    });
    let q = this.collection.find(filters, {
      session: this.options?.transaction,
    });
    query.orders?.forEach(order => {
      if (order.field === 'id') {
        // @ts-ignore
        q = q.sort({
          ['_id']: order.dir ?? 'asc',
        });
      } else {
        q = q.sort({
          [order.field]: order.dir ?? 'asc',
        });
      }
    });

    if (query.limit?.size) q = q.limit(query.limit?.size);
    if (query.limit?.offset) q.skip(query.limit?.offset);

    const results = await q.toArray();

    return Promise.all(
      results.map(async doc => {
        const m = this.toModel(doc) as T;
        if (m && query.edges) {
          await this.walkEdges(m, query.edges);
        }
        return m;
      }),
    );
  }

  query(q?: Query<T>): RepoQuery<T> {
    const _filters: Filter<T>[] = q?.filters ?? [];
    const _orders: Order<T>[] = q?.orders ?? [];
    const _limit: Limit = q?.limit ?? {};

    const _q = {
      filter: (field: Field<T>, op: FilterOp, value: any) => {
        _filters.push({field, op, value});
        return _q;
      },
      order: (field: Field<T>, dir: OrderDirection) => {
        _orders.push({field, dir});
        return _q;
      },
      limit: (size: number, offset?: number) => {
        _limit.size = size;
        _limit.offset = offset;
        return _q;
      },
      run: (edges?: Edge<T>[]) => {
        return this.getMany({
          filters: _filters,
          orders: _orders,
          limit: _limit,
          edges: edges || q?.edges,
        });
      },
    };
    return _q;
  }

  async get(id: string, edges?: Edge<T>[]): Promise<Opt<T>> {
    const r = await this.collection.findOne(this.toIdFilter(id), {
      session: this.options?.transaction,
    });
    const m = this.toModel(r);
    if (m && edges) {
      await this.walkEdges(m, edges);
    }
    return m;
  }

  async delete(id: string): Promise<Success> {
    const r = await this.collection.deleteOne(this.toIdFilter(id), {
      session: this.options?.transaction,
    });
    return r.acknowledged;
  }

  async update(m: RequireOnlyId<T>): Promise<T> {
    if (!m.id) throw Error('update failed. no id');

    // @ts-ignore
    const values: ModelRawData<T> = this.modelClass._toRawData(m);
    // @ts-ignore
    // const updateVals: {[key: keyof mData]: any} = {};
    // for (let key in dirtyFields) {
    //   // @ts-ignore
    //   updateVals[key] = mData[key];
    // }
    // @ts-ignore
    values.updatedAt = Date.now();

    // @ts-ignore: TS bug?
    const r: ModifyResult<MongofiedModelRawData<T>> =
      await this.collection.findOneAndUpdate(
        this.toIdFilter(m.id),
        {
          //@ts-ignore TODO look into tserror
          $set: values,
        },
        {returnDocument: 'after', session: this.options?.transaction},
      );

    if (r.ok) {
      return this.toModel(r.value)!;
    }
    //TODO: typed error
    throw Error('update failed');
  }

  private toIdFilter(id: string): MongoFilter<MongofiedModelRawData<T>> {
    // Cast b/c of Typescript bug:
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/39358
    return {_id: id} as MongoFilter<MongofiedModelRawData<T>>;
  }

  private newId(): string {
    return new ObjectId().toString();
  }

  private toMongoDoc(m: Opt<ModelRawData<T>>): Opt<MongofiedModelRawData<T>> {
    if (!m) return m;
    const {id, ...rest} = m;
    // remove `undefined`
    Object.keys(rest).forEach(
      // @ts-ignore
      key => rest[key] === undefined && delete rest[key],
    );
    return {_id: id, ...rest};
  }

  private toModel(
    mm: MongofiedModelRawData<T> | WithId<MongofiedModelRawData<T>> | null,
  ): Opt<T> {
    if (!mm) return mm;
    const {_id, ...rest} = mm;
    // @ts-ignore
    return this.modelClass._fromRawData({id: _id, ...rest});
  }

  private opToMongoOp(op: FilterOp): string {
    switch (op) {
      case '==':
        return '$eq';
      case '!=':
        return '$ne';
      case '<':
        return '$lt';
      case '<=':
        return '$lte';
      case '>':
        return '$gt';
      case '>=':
        return '$gte';
      case 'IN':
        return '$in';
      case 'NIN':
        return '$nin';
      default:
        throw Error(`Unkonwn op ${op}`);
    }
  }

  // WIP
  // TODO: optimize, check if already loaded
  private async walkEdges(m: T, edges: Edge<T>[]) {
    if (!m || !edges || edges.length == 0) {
      return;
    }
    // @ts-ignore
    const schema: SchemaMeta = ModelUtil.getSchema(this.modelClass);
    const promises = edges.map(async edge => {
      const [field, ...nextEdges] = edge.split('.');
      const type = schema[field]?.type;
      const isArray = isArrayType(type);
      const elemType = isArray ? type.getElementType() : type;

      let query;
      if (isModelRefType(elemType)) {
        const edgeModelClass = elemType.getModelClass();
        const edgeModelRepo = new RepoMongo(edgeModelClass, this.options);
        if (!edgeModelRepo)
          throw Error(
            `Model ${ModelUtil.getName(edgeModelClass)} is not registered`,
          );
        //@ts-ignore
        if (!m[`_${field}`]) return;

        //@ts-ignore
        const ids = isArray
          ? ModelUtil.getRefIds(m, field as keyof T)
          : [ModelUtil.getRefId(m, field as keyof T)];
        query = edgeModelRepo.query({
          filters: [{field: 'id', op: 'IN', value: ids}],
        });
      } else if (isInverseModelRefType(elemType)) {
        const inverseField = elemType.getField();
        const edgeModelClass = elemType.getModelClass();
        const edgeModelRepo = new RepoMongo(edgeModelClass, this.options);
        if (!edgeModelRepo)
          throw Error(
            `Model ${ModelUtil.getName(edgeModelClass)} is not registered`,
          );
        query = edgeModelRepo
          .query()
          //@ts-ignore
          .filter(`${inverseField}.id`, '==', m.id);
      }

      if (!query) throw Error(`Field ${field} is not a edge/edges`);

      //@ts-ignore
      const edgeModels = await query.run(nextEdges);
      if (isArray) {
        //@ts-ignore
        m[`_${field}`] = edgeModels;
      } else {
        //@ts-ignore
        m[`_${field}`] = edgeModels.shift();
      }
    });

    await Promise.all(promises);
  }
}

import {DeletedByTTL, DELETED, TODELETE, REASON_ROOT} from './deletion';

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
