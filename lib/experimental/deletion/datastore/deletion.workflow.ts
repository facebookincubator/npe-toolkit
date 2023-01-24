/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Context} from '@toolkit/data/pads/context';
import {DELETED, REASON_ROOT, TODELETE} from './deletion';
import {DeletionGraphEdge, getGraph} from './deletion.graph';
import {
  BaseModel,
  ModelClass,
  ModelRef,
  ModelUtil,
} from '@toolkit/data/pads/model';
import {
  Edge,
  Field,
  Filter,
  FilterOp,
  OrderDirection,
} from '@toolkit/data/pads/query';
import _registry, {getRepoImpl} from '@toolkit/data/pads/registry';
import {Repo, RepoQuery, Transaction} from '@toolkit/data/pads/repo';
import {ExternalDeletableType, isArrayType} from '@toolkit/data/pads/schema';
import {
  ID,
  IS_JEST_TEST,
  Opt,
  OptionalId,
  RequireOnlyId,
} from '@toolkit/data/pads/utils';

// Make it possible for deletion flow to work with different local/distributed workflow platforms
export interface JobQueue {
  enqueue(jobData: JobData, jobOptions?: JobOptions): ID | Promise<ID>;
}
export type JobData = {
  type: DeletionJobType;
  input?: any;
  deps?: ID[];
};
export type JobOptions = {
  dryrun?: boolean;
} & Record<string, any>;

type Job = JobData & {
  id: string;
  status?: 'STARTED' | 'FINISHED' | 'FAILED';
  result?: any;
  error?: Error;
  options?: JobOptions;
};

// Simple workflow/job queue to run locally
export class LocalQueue implements JobQueue {
  readonly _jobs: Job[] = [];
  readonly _jobStatuses: Record<string, Job> = {};

  async enqueue(jobData: JobData, jobOptions?: JobOptions): Promise<ID> {
    const job = {
      id: Math.random().toString(36),
      type: jobData.type,
      input: jobData.input,
      deps: jobData.deps,
      options: jobOptions,
    };
    this._jobs.push(job);
    return job.id;
  }

  async runQueue(worker: DeletionWorker) {
    var self = this;
    function checkDeps(job: Job) {
      if (!job.deps || job.deps.length === 0) return true;
      if (job.deps.some(dep => self._jobStatuses[dep].status === 'FAILED')) {
        throw new Error(
          `${job.type}:${job.id} deps not met. One or more dep job failed.`,
        );
      }
      return job.deps.every(
        dep => self._jobStatuses[dep].status === 'FINISHED',
      );
    }
    while (this._jobs && this._jobs.length > 0) {
      const job = this._jobs.shift()!;
      if (!checkDeps(job)) {
        // Dep jobs not finished. Push back into the queue.
        this._jobs.push(job);
        continue;
      }
      const fn = worker[job.type];
      if (!fn) {
        throw new Error(`${job.type} fn not found.`);
      }
      try {
        job.status = 'STARTED';
        this._jobStatuses[job.id] = job;
        job.result = await fn.bind(worker)(job.input, job.options);
        job.status = 'FINISHED';
      } catch (err: any) {
        job.error = err;
        job.status = 'FAILED';
        console.error(err);
      }
    }
  }

  getJobStatuses() {
    return this._jobStatuses;
  }
}

type DeletionJobType = Extract<
  keyof DeletionWorker,
  | 'initiateDeletion'
  | 'startGraphDeletion'
  | 'finishGraphDeletion'
  | 'processTriggerOUTNODE'
  | 'processTriggerINNODE'
  | 'startExternalDeletion'
  | 'runFieldExternalDeletion'
  | 'initiateRestoration'
  | 'startGraphRestoration'
  | 'startExternalRestoration'
  | 'runFieldExternalRestoration'
>;

export class DeletionWorker {
  constructor(
    protected queue: JobQueue,
    protected registryWrapper: RegistryWrapper = DEFAULT_REGISTRY_WRAPPER,
  ) {}

  async initiateDeletion(
    input: {
      modelName: string;
      modelId: ID;
      reason: ID | 'ROOT';
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId, reason} = input;

    if (
      modelName === ModelUtil.getName(DELETED) ||
      modelName === ModelUtil.getName(TODELETE)
    ) {
      throw new Error(`Graph deletion not allowed on ${modelName} `);
    }

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelRepo = this.registryWrapper.getRepo(modelClass);
    // @ts-ignore
    const runWithTransaction = getRepoImpl().runWithTransaction;

    const deletedId = DELETED.genId(modelName, modelId);
    const deleted = await runWithTransaction(async (txn: Transaction) => {
      const modelRepoTxn = modelRepo.useTransaction(txn);
      const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);

      const mFound = await modelRepoTxn.get(modelId);
      if (!mFound) {
        if (!reason) {
          console.log(
            `"${deletedId}" does not exist or is already deleted. Ignore.`,
          );
          return;
        }
        // Add this reason to deletedM if exists
        const deletedMFound = await DELETED_REPO_TXN.get(deletedId);
        if (!deletedMFound) {
          console.log(
            `"${deletedId}" deletion initiated by "${reason}" but
            the MODEL object nor DELETED object exists. Ignore.`,
          );
          return;
        }
        // TODO: use array-add/union op
        if (!deletedMFound.reasons?.includes(reason)) {
          if (!deletedMFound.reasons) {
            deletedMFound.reasons = [reason];
          } else {
            deletedMFound.reasons.push(reason);
          }
          await DELETED_REPO_TXN.update(deletedMFound);
        }
        return;
      } else {
        const r = await modelRepoTxn.delete(modelId);
        if (!r) {
          throw new Error(`Failed to delete ${modelName}:${modelId}`);
        }
        return await DELETED_REPO_TXN.create({
          id: deletedId,
          modelId: modelId,
          modelName: modelName,
          //@ts-ignore
          modelData: modelClass._toRawData(mFound),
          reasons: reason ? [reason] : [],
          status: 'INIT',
        });
      }
    });

    if (deleted) {
      await this.queue.enqueue(
        {
          type: 'startGraphDeletion',
          input: {modelName, modelId},
        },
        options,
      );
      if (!options?.dryrun) {
        await this.queue.enqueue(
          {
            type: 'startExternalDeletion',
            input: {modelName, modelId, deletePermanetly: false},
          },
          options,
        );
      }
    }
    return deleted;
  }

  async startGraphDeletion(
    input: {
      modelName: string;
      modelId: ID;
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId} = input;

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);

    const graph = getGraph();
    // @ts-ignore
    const runWithTransaction = getRepoImpl().runWithTransaction;

    const deletedId = DELETED.genId(modelName, modelId);
    const deleted = await runWithTransaction(async (txn: Transaction) => {
      const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);

      const deleted = await DELETED_REPO_TXN.get(deletedId);
      if (!deleted) {
        console.warn(`${deletedId} not found`);
        return;
      }
      if (deleted.status !== 'INIT') {
        console.warn(
          `${deletedId} status should be INIT but is ${deleted.status}`,
        );
        return;
      }

      return await DELETED_REPO_TXN.update({
        id: deletedId,
        status: 'STARTED',
      });
    });

    if (!deleted) {
      console.warn(`Skip ${deletedId}`);
      return;
    }

    const edges = graph.edges[modelName];
    const deps = [];
    for (const edge of edges || []) {
      if (edge.trigger === 'OUTNODE') {
        deps.push(
          await this.queue.enqueue(
            {
              type: 'processTriggerOUTNODE',
              input: {modelName, modelId, edge},
            },
            options,
          ),
        );
      } else if (edge.trigger === 'INNODE') {
        deps.push(
          await this.queue.enqueue(
            {
              type: 'processTriggerINNODE',
              input: {modelName, modelId, edge},
            },
            options,
          ),
        );
      } else {
        console.warn(
          `Ignoring non-graph deletion rule trigger "${edge.trigger}"`,
        );
      }
    }

    await this.queue.enqueue(
      {
        type: 'finishGraphDeletion',
        input: {modelName, modelId},
        deps: deps,
      },
      options,
    );
  }

  async finishGraphDeletion(
    input: {
      modelName: string;
      modelId: ID;
    },
    options?: JobOptions,
  ): Promise<DELETED> {
    const {modelName, modelId} = input;

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);

    const deletedId = DELETED.genId(modelName, modelId);
    // @ts-ignore
    const runWithTransaction = getRepoImpl().runWithTransaction;

    // TODO: error from dep jobs
    let error: Error;
    const deleted = await runWithTransaction(async (txn: Transaction) => {
      const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);
      const deleted = await DELETED_REPO_TXN.get(deletedId);
      if (!deleted) {
        throw Error(`${deletedId} not found`);
      }
      if (deleted.status !== 'STARTED') {
        throw Error(
          `${deletedId} state should be STARTED but is ${deleted.status}`,
        );
      }
      return await DELETED_REPO.update({
        id: deletedId,
        status: error ? 'FAILED' : 'FINISHED',
        details: error ? error.message : undefined,
      });
    });
    return deleted;
  }

  /**
   * Go through in-node objects referencing `m` and start the deletion process.
   * Deletion process is triggered by out-node `m` getting deleted,
   * thus `edge.trigger == "OUTNODE"`
   */
  async processTriggerOUTNODE(
    input: {
      modelName: string;
      modelId: ID;
      edge: DeletionGraphEdge;
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId, edge} = input;

    if (edge.trigger !== 'OUTNODE') {
      return;
    }
    const deletedId = DELETED.genId(modelName, modelId);

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelRepo = this.registryWrapper.getRepo(modelClass);

    const childName = edge.modelName;
    const childModelClass = this.registryWrapper.getModel(childName);
    const childRepo = this.registryWrapper.getRepo(childModelClass);
    const childSchema = ModelUtil.getSchema(childModelClass!);

    const edgeFieldType = childSchema[edge.field]?.type;
    if (!edgeFieldType) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(`"${modelName}" does not have a field "${edge.field}"`);
      return;
    }

    // New objects to delete
    let childObjsToDelete;

    if (isArrayType(edgeFieldType)) {
      if (edge.condition === 'ANY_DELETED') {
        childObjsToDelete = await childRepo
          ?.query()
          // @ts-ignore
          .filter(`${edge.field}.id`, '==', modelId)
          .run();
      } else if (edge.condition === 'ALL_DELETED') {
        const childObjs = await childRepo
          ?.query()
          // @ts-ignore
          .filter(`${edge.field}.id`, '==', modelId)
          .run();
        // Find parents of children i.e. walk edges
        // It's done out of the initial query simplify dryrun impl (next diff)
        const parentsOfChildren = await Promise.all(
          childObjs.map(child => {
            return modelRepo
              .query()
              .filter(
                'id',
                'IN',
                // @ts-ignore : collect outnode ids
                child[edge.field].map((e: ModelRef<BaseModel>) => e.id),
              )
              .run();
          }),
        );
        childObjsToDelete = childObjs?.filter(
          (_, i) =>
            parentsOfChildren[i].filter(r => r !== undefined).length === 0,
        );
      }
    } else {
      if (edge.condition === 'DELETED') {
        childObjsToDelete = await childRepo
          ?.query()
          // @ts-ignore
          .filter(`${edge.field}.id`, '==', modelId)
          .run();
      }
    }

    if (!childObjsToDelete || childObjsToDelete.length === 0) {
      return;
    }

    const promises = childObjsToDelete.map((child: BaseModel) =>
      this.queue.enqueue(
        {
          type: 'initiateDeletion',
          input: {modelName: childName, modelId: child.id, reason: deletedId},
        },
        options,
      ),
    );
    await Promise.all(promises);
  }

  /**
   * Go through out-node objects referenced by `m` and start the deletion process.
   * Deletion process is triggered by in-node `m` getting deleted,
   * thus `edge.trigger == "INNODE"`
   */
  async processTriggerINNODE(
    input: {
      modelName: string;
      modelId: ID;
      edge: DeletionGraphEdge;
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId, edge} = input;

    if (edge.trigger !== 'INNODE') {
      return;
    }
    const DELETED_REPO: Repo<DELETED> = this.registryWrapper.getRepo(DELETED);
    const deletedId = DELETED.genId(modelName, modelId);
    const deleted = await DELETED_REPO.get(deletedId);

    if (!deleted) {
      console.warn(`DELETED "${deletedId}" not found`);
      return;
    }

    // @ts-ignore
    const modelClass = this.registryWrapper.getModel(modelName)!;
    const modelRepo = this.registryWrapper.getRepo(modelClass)!;
    const modelSchema = ModelUtil.getSchema(modelClass);

    const parentName = edge.modelName;
    const parentModelClass = this.registryWrapper.getModel(parentName);
    const parentRepo = this.registryWrapper.getRepo(parentModelClass!);

    const edgeFieldType = modelSchema[edge.field]?.type;
    if (!edgeFieldType) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(`"${modelName}" does not have a field "${edge.field}"`);
      return;
    }

    const edgeFieldVal = deleted.modelData
      ? deleted.modelData[edge.field]
      : undefined;
    if (!edgeFieldVal) return;

    const parentIds = [];
    if (Array.isArray(edgeFieldVal)) {
      edgeFieldVal.forEach(p => {
        parentIds.push(p.id);
      });
    } else {
      parentIds.push(edgeFieldVal.id);
    }

    if (parentIds.length === 0) return;

    // New objects to delete
    let parentObjsToDelete;

    if (edge.condition === 'ANY_DELETED') {
      parentObjsToDelete = await parentRepo
        .query()
        .filter('id', 'IN', parentIds)
        .run();
    } else if (edge.condition === 'ALL_DELETED') {
      const parentObjs = await parentRepo
        .query()
        .filter('id', 'IN', parentIds)
        .run();
      if (!parentObjs || parentObjs.length === 0) {
        return;
      }
      // TODO: consider rewriting as a single query using `IN`
      const childrenOfParents = await Promise.all(
        parentObjs.map((parent: any) => {
          return (
            modelRepo
              .query()
              // @ts-ignore
              .filter(`${edge.field}.id`, '==', parent.id)
              .run()
          );
        }),
      );
      parentObjsToDelete = parentObjs.filter((_: any, index: number) => {
        // @ts-ignore
        return childrenOfParents[index].length === 0;
      });
    }

    if (!parentObjsToDelete || parentObjsToDelete.length === 0) {
      return;
    }

    const promises = parentObjsToDelete.map((parent: BaseModel) =>
      this.queue.enqueue(
        {
          type: 'initiateDeletion',
          input: {modelName: parentName, modelId: parent.id, reason: deletedId},
        },
        options,
      ),
    );
    await Promise.all(promises);
  }

  async startExternalDeletion(
    input: {
      modelName: string;
      modelId: ID;
      modelData?: any;
      deletePermanetly?: boolean;
    },
    options?: JobOptions,
  ) {
    if (options?.dryrun) {
      throw new Error('Can not dryrun external deletion');
    }

    const {modelName, modelId, deletePermanetly} = input;

    let modelData = input.modelData;
    if (!modelData) {
      const DELETED_REPO = this.registryWrapper.getRepo(DELETED);
      const deletedId = DELETED.genId(modelName, modelId);
      const deleted = await DELETED_REPO.get(deletedId);
      if (deleted) {
        modelData = deleted.modelData;
      }
    }

    if (!modelData) {
      console.warn(
        `${modelName}:${modelId} modeldata not found . Nothing to do.`,
      );
      return;
    }

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelSchema = ModelUtil.getSchema(modelClass);

    const jobs = Object.keys(modelSchema).map(schemaField => {
      const fieldType = modelSchema[schemaField]?.type;
      const fieldValue = modelData[schemaField];
      if (!(fieldType instanceof ExternalDeletableType) || !fieldValue) {
        return;
      }
      return this.queue.enqueue(
        {
          type: 'runFieldExternalDeletion',
          input: {
            modelName,
            modelId,
            modelFieldName: schemaField,
            modelFieldData: fieldValue,
            deletePermanetly,
          },
        },
        options,
      );
    });

    await Promise.all(jobs);
  }

  async runFieldExternalDeletion(
    input: {
      modelName: string;
      modelId: ID;
      modelFieldName: string;
      modelFieldData: any;
      deletePermanetly?: boolean;
    },
    options?: JobOptions,
  ) {
    if (options?.dryrun) {
      throw new Error('Can not dryrun external deletion');
    }

    const {modelName, modelFieldName, modelFieldData, deletePermanetly} = input;

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelSchema = ModelUtil.getSchema(modelClass);

    const edgeFieldType = modelSchema[modelFieldName]?.type;
    if (!edgeFieldType) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(
        `"${modelName}" does not have a field "${modelFieldName}"`,
        input,
        options,
      );
      return;
    }
    if (!(edgeFieldType instanceof ExternalDeletableType)) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(
        `"${modelName}" is not ExternalDeletableType "${edgeFieldType}"`,
        input,
        options,
      );
      return;
    }

    if (deletePermanetly) {
      await edgeFieldType.onHardDelete(modelFieldData);
    } else {
      await edgeFieldType.onSoftDelete(modelFieldData);
    }
  }

  /**
   * `initiateRestoration` checks the deleted object's restoration condition,
   * schedules a sub-graph restoration, and restore the object.
   */
  async initiateRestoration(
    input: {
      modelName: string;
      modelId: ID;
      reason: ID | 'ROOT';
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId, reason} = input;

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);
    // @ts-ignore
    const runWithTransaction = getRepoImpl().runWithTransaction;

    const deletedId = DELETED.genId(modelName, modelId);
    const modelClass = this.registryWrapper.getModel(modelName);
    const modelRepo = this.registryWrapper.getRepo(modelClass);

    const deleted: DELETED | undefined = await runWithTransaction(
      async (txn: Transaction) => {
        const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);

        const deleted = await DELETED_REPO_TXN.get(deletedId);

        if (!deleted) {
          console.warn(`${deletedId} not found`);
          return;
        }
        if (deleted.status !== 'FINISHED') {
          console.warn(
            `${deletedId} status should be FINISHED but is ${deleted.status}`,
          );
          return;
        }
        if (!deleted.modelData) {
          console.warn(`${deletedId} has no data to restore`);
          return;
        }
        if (
          reason !== REASON_ROOT &&
          deleted.reasons.filter((r: string) => r !== reason).length > 0
        ) {
          console.warn(
            `${deletedId} has other reasons for it to stay deleted ${deleted.reasons}`,
          );
          const remainingReasons = deleted.reasons.filter(
            (r: string) => r !== reason,
          );
          await DELETED_REPO_TXN.update({
            id: deletedId,
            reasons: remainingReasons,
          });
          return;
        }

        return await DELETED_REPO_TXN.update({
          id: deletedId,
          status: 'RESTORE_STARTED',
        });
      },
    );

    if (!deleted || deleted.status != 'RESTORE_STARTED') {
      return;
    }

    try {
      // Schedule a sub-gragph restoration job
      await this.queue.enqueue(
        {
          type: 'startGraphRestoration',
          input: {modelName, modelId},
        },
        options,
      );
      if (!options?.dryrun) {
        await this.queue.enqueue(
          {
            type: 'startExternalRestoration',
            input: {modelName, modelId},
          },
          options,
        );
      }

      // Restore and delete DELETED
      return await runWithTransaction(async (txn: Transaction) => {
        const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);
        const modelRepoTxn = modelRepo.useTransaction(txn);
        await DELETED_REPO_TXN.delete(deletedId);
        return await modelRepoTxn.create({
          ...deleted.modelData!,
          id: deleted.modelId,
        });
      });
    } catch (error: any) {
      await DELETED_REPO.update({
        id: deletedId,
        status: 'RESTORE_FAILED',
        details: error.message,
      });
    }
  }

  /**
   * `startGraphRestoration` finds other objects deleted by the restored object
   * and schedules restoration.
   */
  async startGraphRestoration(
    input: {
      modelName: string;
      modelId: ID;
    },
    options?: JobOptions,
  ) {
    const {modelName, modelId} = input;

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);
    // @ts-ignore
    const runWithTransaction = getRepoImpl().runWithTransaction;

    const deletedId = DELETED.genId(modelName, modelId);

    const objsWithReason = await DELETED_REPO.query()
      .filter('reasons', '==', deletedId)
      .run();

    console.log(
      `Found ${objsWithReason.length} objects with reason ${deletedId}`,
    );

    const chunkSize = 50;
    console.assert(chunkSize > 0, 'Chunk size must be larger than 0');

    if (objsWithReason.length === 0) {
      return;
    }
    for (let i = 0; i < objsWithReason.length; i += chunkSize) {
      const chunk = objsWithReason.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(obj => {
          this.queue.enqueue(
            {
              type: 'initiateRestoration',
              input: {
                modelName: obj.modelName,
                modelId: obj.modelId,
                reason: deletedId,
              },
            },
            options,
          );
        }),
      );
    }
  }

  async startExternalRestoration(
    input: {modelName: string; modelId: ID},
    options?: JobOptions,
  ) {
    if (options?.dryrun) {
      throw new Error('Can not dryrun external deletion');
    }

    const {modelName, modelId} = input;

    let modelData: any;

    const DELETED_REPO = this.registryWrapper.getRepo(DELETED);

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelRepo = this.registryWrapper.getRepo(modelClass);

    const deletedId = DELETED.genId(modelName, modelId);
    const deleted = await DELETED_REPO.get(deletedId);
    if (deleted) {
      modelData = deleted.modelData;
    } else {
      const model = await modelRepo.get(modelId);
      if (model) {
        modelData = model;
      }
    }

    if (!modelData) {
      console.log(`No modeldata found for ${deletedId}`, input, options);
      return;
    }

    const modelSchema = ModelUtil.getSchema(modelClass);

    const jobs = Object.keys(modelSchema).map(schemaField => {
      const fieldType = modelSchema[schemaField]?.type;
      const fieldValue = modelData![schemaField];
      if (!fieldValue || !(fieldType instanceof ExternalDeletableType)) {
        return;
      }
      return this.queue.enqueue(
        {
          type: 'runFieldExternalRestoration',
          input: {
            modelName,
            modelId,
            modelFieldName: schemaField,
            modelFieldData: fieldValue,
          },
        },
        options,
      );
    });

    await Promise.all(jobs);
  }

  async runFieldExternalRestoration(
    input: {
      modelName: string;
      modelId: ID;
      modelFieldName: string;
      modelFieldData: any;
    },
    options?: JobOptions,
  ) {
    if (options?.dryrun) {
      throw new Error('Can not dryrun external restoration');
    }

    const {modelName, modelFieldName, modelFieldData} = input;

    const modelClass = this.registryWrapper.getModel(modelName);
    const modelSchema = ModelUtil.getSchema(modelClass);

    const edgeFieldType = modelSchema[modelFieldName]?.type;
    if (!edgeFieldType) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(
        `"${modelName}" does not have a field "${modelFieldName}"`,
        input,
        options,
      );
      return;
    }
    if (!(edgeFieldType instanceof ExternalDeletableType)) {
      // TODO: this shouldn't happen but we don't do schema version check
      console.warn(
        `"${modelName}" is not ExternalDeletableType "${edgeFieldType}"`,
        input,
        options,
      );
      return;
    }

    await edgeFieldType.onRestore(modelFieldData);
  }
}

// RegistryWrapper wraps global or dryrun registry based on `JobOptions`.
// It is used with `DeletionWorker` to support actual/dryrun deletion/restoration usecases.
export class RegistryWrapper {
  registryOfChoice: {
    getModel: <T extends BaseModel>(mName: string) => ModelClass<T>;
    getRepo: <T extends BaseModel>(modelClass: ModelClass<T>) => Repo<T>;
  };

  constructor(protected jobOptions?: JobOptions) {
    if (jobOptions?.dryrun) {
      this.registryOfChoice = (function () {
        // Store dryrun data - Map<ModelName=string, Store=Record<ID, ModelInstance>
        const storeMap: Map<string, Record<ID, any>> = new Map();
        const getStore = <T extends BaseModel>(
          modelClass: ModelClass<T>,
        ): Record<ID, T> => {
          const modelName: string = ModelUtil.getName(modelClass);
          if (!storeMap.has(modelName)) {
            storeMap.set(modelName, {});
          }
          return storeMap.get(modelName)!;
        };
        return {
          reset: () => {
            storeMap.clear();
          },
          getStoreMap: () => {
            return storeMap;
          },
          getModel: <T extends BaseModel>(modelName: string) => {
            return _registry.getModel<T>(modelName);
          },
          getRepo: (modelClass: ModelClass<any>) => {
            return new RepoForDryrun(
              modelClass,
              getStore(modelClass),
              getStore(DELETED),
            );
          },
        };
      })();
    } else {
      this.registryOfChoice = _registry;
    }
  }

  getModel<T extends BaseModel>(modelName: string): ModelClass<T> {
    return this.registryOfChoice.getModel<T>(modelName);
  }
  getRepo<T extends BaseModel>(modelClass: ModelClass<T>): Repo<T> {
    return this.jobOptions?.dryrun
      ? this.registryOfChoice!.getRepo(modelClass)
      : _registry.getRepo(modelClass);
  }
}

export const DEFAULT_REGISTRY_WRAPPER = new RegistryWrapper();
/**
 * RepoForDryrun class
 * Writes - update the local store only.
 * Reads - read from both the in-memory local db + real db and filter deleted objects.
 */
class RepoForDryrun<T extends BaseModel> implements Repo<T> {
  readonly modelStore: Record<ID, T>;
  readonly modelClass: ModelClass<T>;
  readonly modelRepo: Repo<T>;
  readonly deletedStore: Record<ID, DELETED>;

  constructor(
    mClass: ModelClass<T>,
    modelStore: Record<ID, T>,
    deletedStore: Record<ID, DELETED>,
  ) {
    this.modelClass = mClass;
    this.modelStore = modelStore;
    this.deletedStore = deletedStore;
    this.modelRepo = _registry.getRepo(mClass);
  }

  private existsDELETED(id: ID): boolean {
    const deletedId = DELETED.genId(ModelUtil.getName(this.modelClass), id);
    return !!this.deletedStore[deletedId];
  }

  async create(m: OptionalId<T>): Promise<T> {
    const now = Date.now();
    // @ts-ignore
    const mRaw: ModelRawData<T> = this.modelClass._toRawData(m);
    if (!mRaw.id) mRaw.id = Math.random().toString(36).substring(2);
    mRaw.createdAt = mRaw.createdAt ?? now;
    mRaw.updatedAt = mRaw.updatedAt ?? now;
    this.modelStore[mRaw.id] = mRaw;
    // @ts-ignore
    return this.modelClass._fromRawData(mRaw);
  }
  async get(id: ID, edges?: Edge<T>[]): Promise<Opt<T>> {
    if (edges) throw new Error('edges walking not implemented.');
    if (this.existsDELETED(id)) {
      return null;
    }
    if (this.modelStore[id]) {
      return this.modelStore[id];
    }
    return this.modelRepo.get(id, edges);
  }
  query(): RepoQuery<T> {
    const _filters: Filter<T>[] = [];
    const _q = {
      filter: (field: Field<T>, op: FilterOp, value: any) => {
        if (op !== '==' && op !== 'IN') {
          throw new Error(`${op} filter not implemented.`);
        }
        _filters.push({field, op, value});
        return _q;
      },
      order: (_: Field<T>, __: OrderDirection) => {
        throw new Error('order not implemented.');
      },
      limit: (_: number, __?: number) => {
        throw new Error('limit not implemented.');
      },
      run: async (edges?: Edge<T>[]) => {
        if (edges) throw new Error('edges walking not implemented.');

        // Query db
        const results = await this.modelRepo.query({filters: _filters}).run();
        // Query local store
        Object.values(this.modelStore).forEach(v => {
          let match = true;
          for (const filter of _filters) {
            const [field, subField] = filter.value.split('.');
            // @ts-ignore
            const fieldValue = v[field];
            const filterValue = subField ? fieldValue[subField] : fieldValue;
            if (
              (filter.op === '==' && filterValue != filter.value) ||
              (filter.op === 'IN' && !filter.value.includes(filterValue))
            ) {
              match = false;
              break;
            }
          }
          if (match) {
            results.push(v);
          }
        });
        // Dedup and filter already deleted
        return Object.values(
          results.reduce((soFar: Record<ID, BaseModel>, v) => {
            if (!this.existsDELETED(v.id)) {
              soFar[v.id] = v;
            }
            return soFar;
          }, {}),
        ) as T[];
      },
    };
    return _q;
  }
  async delete(id: ID): Promise<boolean> {
    return delete this.modelStore[id];
  }
  async update(m: RequireOnlyId<T>): Promise<T> {
    const mFound = await this.get(m.id);
    if (!mFound) {
      if (!mFound) throw new Error(`Object with ${m.id} Not found`);
    }

    // @ts-ignore
    const mFoundRaw = this.modelClass._toRawData(mFound);
    // @ts-ignore
    const values: ModelRawData<T> = this.modelClass._toRawData(m);
    values.updatedAt = Date.now();
    // @ts-ignore
    return this.modelClass._fromRawData(
      (this.modelStore[m.id] = {...mFoundRaw, ...values}),
    );
  }
  useTransaction(txn: any): Repo<T> {
    return this;
  }
  useContext(ctx: Context): Repo<T> {
    return this;
  }
}

if (IS_JEST_TEST) {
  exports.ForTesting = {
    RepoForDryrun,
  };
}
