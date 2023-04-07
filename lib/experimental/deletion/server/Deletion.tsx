/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as admin from 'firebase-admin';
import {Opt} from '@toolkit/core/util/Types';
import {
  BaseModel,
  DataStore,
  EdgeSelector,
  ModelClass,
  ModelUtil,
  Updater,
  Where,
  Order as _Order,
  isArrayType,
  isModelRefType,
} from '@toolkit/data/DataStore';
import {
  Edge,
  Field,
  Filter,
  FilterOp,
  Limit,
  Order,
  OrderDirection,
  Query,
} from '@toolkit/data/pads/query';
import {
  Repo,
  RepoQuery,
  RunWithTransactionCallback,
} from '@toolkit/data/pads/repo';
import {OptionalId, Success} from '@toolkit/data/pads/utils';
import {toRepoRepresentation} from '@toolkit/providers/firebase/DataStore';
import {getFirebaseConfig} from '@toolkit/providers/firebase/server/Config';
import {getAdminDataStore} from '@toolkit/providers/firebase/server/Firestore';

type Transaction = admin.firestore.Transaction;
type RepoOpOptions = {
  transaction?: Transaction;
};

/**
 * Repo AdminDataStore wrapper
 * Implements PADS Repo interface to share deletion graph/workflow implementation
 *
 * It is only used for deletion at the moment
 */
export class FirestoreDeletionRepo<T extends BaseModel> implements Repo<T> {
  protected readonly adminStore: DataStore<T>;
  protected readonly modelClass: ModelClass<T>;
  protected readonly options: RepoOpOptions;

  static async runWithTransaction(
    fn: RunWithTransactionCallback<unknown>,
  ): Promise<ReturnType<typeof fn>> {
    try {
      const adminFirestore = admin.firestore();
      return await adminFirestore.runTransaction(
        async (transaction: Transaction) => {
          return await fn(transaction);
        },
      );
    } catch (err) {
      console.log('Transaction failed: ' + err);
      throw err;
    }
  }

  constructor(mClass: ModelClass<T>, options?: RepoOpOptions) {
    this.modelClass = mClass;
    this.options = options ?? {};
    const conf = getFirebaseConfig();
    this.adminStore = getAdminDataStore(this.modelClass, undefined, {
      ...conf,
      keepEdge: true,
    });
  }

  async create(m: OptionalId<T>): Promise<T> {
    return toRepoRepresentation(
      this.modelClass,
      await this.adminStore.create(m as Updater<T>),
    )!;
  }

  async get(id: string, edges?: Edge<T>[]): Promise<Opt<T>> {
    const result = await this.adminStore.get(id, {
      edges: this.toEdgeSelectors(edges),
    });
    return result ? toRepoRepresentation(this.modelClass, result) : result;
  }

  async getMany(query: Query<T>): Promise<T[]> {
    if (query.limit?.offset || query.limit?.size) {
      // TODO: support edges and limit
      throw new Error('Not implemented');
    }

    function getFirestoreField(field: string) {
      if (field === 'id') {
        return admin.firestore.FieldPath.documentId();
      } else if (field.endsWith('.id')) {
        return field.substr(0, field.length - 3);
      } else {
        return field;
      }
    }

    // @ts-ignore
    const wheres: Where[] | undefined = query.filters?.map(f => {
      const field = getFirestoreField(f.field as string);

      let isFieldArrayType = false;
      if (typeof field === 'string') {
        const schema = ModelUtil.getSchema(this.modelClass);
        const fieldType = schema[field]?.type;
        isFieldArrayType = isArrayType(fieldType);
      }

      return {
        field,
        op: this.opToFirestoreOp(f.op, isFieldArrayType),
        value: f.value,
      };
    });

    // @ts-ignore
    const orders: _Order[] | undefined = query.orders?.map(order => {
      const field = getFirestoreField(order.field as string);
      return {
        field,
        dir: order.dir ?? 'asc',
      };
    });

    const results = await this.adminStore.getMany({
      query: {
        where: wheres,
        order: orders,
      },
      edges: this.toEdgeSelectors(query.edges),
    });
    return results.map(r => toRepoRepresentation(this.modelClass, r));
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

  async delete(id: string): Promise<Success> {
    await this.adminStore.remove(id);
    return true;
  }

  async update(m: Partial<T>): Promise<T> {
    return toRepoRepresentation(
      this.modelClass,
      await this.adminStore.update(m),
    );
  }

  useTransaction(txn: Transaction): Repo<T> {
    return new FirestoreDeletionRepo(this.modelClass, {
      ...this.options,
      transaction: txn,
    });
  }

  useContext(_: any): Repo<T> {
    throw new Error('Not implemented');
  }

  private toEdgeSelectors(edges?: Edge<T>[]): EdgeSelector[] | undefined {
    if (!edges || edges.length == 0) {
      return undefined;
    }
    const schema = ModelUtil.getSchema(this.modelClass);
    return edges.map(edge => {
      const [field, ...nextEdges] = edge.split('.');
      if (nextEdges.length) {
        throw Error('Only single depth is supported');
      }

      const type = schema[field]?.type;
      const isArray = isArrayType(type);
      //@ts-ignore
      const elemType = isArray ? type.getElementType() : type;
      if (!isModelRefType(elemType)) {
        throw Error(`${field}" is not a Model Ref type`);
      }
      return [this.modelClass, elemType.getModelClass(), 1];
    });
  }

  private opToFirestoreOp(op: FilterOp, isArrayField?: boolean) {
    switch (op) {
      case '==':
        if (isArrayField) {
          return 'array-contains';
        } else {
          return op;
        }
      case '!=':
      case '<':
      case '<=':
      case '>':
      case '>=':
        return op;
      case 'IN':
        return 'in';
      case 'NIN':
        return 'not-in';
      default:
        throw Error(`Unkonwn op ${op}`);
    }
  }
}
