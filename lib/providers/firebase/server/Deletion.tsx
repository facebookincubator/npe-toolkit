/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

//@ts-ignore
import * as graph from '@npe/pads/src/deletion.graph';
import * as workflow from '@npe/pads/src/deletion.workflow';
import {
  DeletionWorker,
  JobData,
  JobOptions,
  LocalQueue,
  RegistryWrapper,
} from '@npe/pads/src/deletion.workflow';
import Role from '@toolkit/core/api/Roles';
import {FirestoreDeletionRepo} from '@toolkit/core/server/Deletion';
import {
  BaseModel,
  DELETED,
  DeletedByTTL,
  initRegistry,
  ModelUtil,
  REASON_ROOT,
  registry,
  TODELETE,
} from '@toolkit/data/DataStore';
import {
  API_DELETION_DRYRUN_DELETION,
  API_DELETION_DRYRUN_RESTORATION,
  API_DELETION_GET_GRAPH,
  API_DELETION_RUN_JOB,
} from '@toolkit/data/DeletionApi';
import {
  toDatastoreRepresentation,
  toRepoRepresentation,
} from '@toolkit/providers/firebase/DataStore';
import {getFirebaseConfig} from '@toolkit/providers/firebase/server/Config';
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';
import {
  getFunctions,
  TaskOptions,
  TaskQueue,
} from 'firebase-admin/lib/functions';
import * as functions from 'firebase-functions';

const firebaseConfig = getFirebaseConfig();
const deletionConfig = {
  ...{
    // Default config
    maxConcurrentDispatches: 10,
    retryMaxAttempts: 3,
    retryMinBackoffSeconds: 10,
    ttlCronSchedule: 'every 1 hours',
  },
  ...(firebaseConfig.deletionConfig ?? {}),
};

// JobQueue implementation using Firebase TaskQueue
export class FirebaseDeletionQueue implements workflow.JobQueue {
  queue: TaskQueue;

  constructor(queueName: string) {
    this.queue = getFunctions().taskQueue(queueName);
  }

  async enqueue(
    jobData: workflow.JobData,
    opts?: TaskOptions,
  ): Promise<string> {
    const id = Math.random().toString(36);
    await this.queue.enqueue(
      {id: id, ...jobData},
      opts ?? {
        // Add a bit of delay b/c of eventual consistency
        scheduleDelaySeconds: 1,
        dispatchDeadlineSeconds: 60 * 30, // 30 minutes (max allowed)
      },
    );
    if (jobData.deps?.length) {
      functions.logger.warn(
        'Firebase Tasks does not support job dependencies and will be ignored.',
      );
    }
    return id;
  }
}

// Init registry
initRegistry(FirestoreDeletionRepo);

// Init queue and workflow
const fullQueueName =
  (firebaseConfig.namespace ? firebaseConfig.namespace + '-' : '') +
  'deletion-deletionQueue';
// `deletion` is the Firebase Functions name prefix (i.e. export name in `index.ts`)
// 'deletionQueue` is the name of Firebase Functions task queue below (i.e. `const deletionQueue=functions.task.taskQueue(...)`)
const queue: FirebaseDeletionQueue = new FirebaseDeletionQueue(fullQueueName);
const worker = new DeletionWorker(queue);

// Create a task queue and set the worker onDispatch function
export const deletionQueue = functions.tasks
  .taskQueue({
    retryConfig: {
      maxAttempts: deletionConfig.retryMaxAttempts,
      minBackoffSeconds: deletionConfig.retryMinBackoffSeconds,
    },
    rateLimits: {
      maxConcurrentDispatches: deletionConfig.maxConcurrentDispatches,
    },
  })
  .onDispatch(async (job: workflow.JobData) => {
    functions.logger.log('Run job:', JSON.stringify(job));
    const fn = worker[job.type];
    if (!fn) {
      throw new Error(`${job.type} fn not found.`);
    }
    try {
      await fn.bind(worker)(job.input);
    } catch (err: any) {
      functions.logger.error(err);
      throw err;
    }
  });

const triggerPath =
  (firebaseConfig.namespace ? `instance/${firebaseConfig.namespace}/` : '') +
  '{collectionId}/{documentId}';

// Register `OnCreate` trigger handler.
// When a new document is created, check for TTL rule and schedule a future deletion job.
// - NOTE: Nested subcollections not supported.
// - `.runWith({failurePolicy: true})` enables retries till successful (over 7 day window)
//    https://firebase.google.com/docs/functions/retries#enabling_and_disabling_retries
export const runOnDocCreate = functions
  .runWith({failurePolicy: true})
  .firestore.document(triggerPath)
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const collection = snapshot.ref.parent;
    const modelName = collection.id;
    const modelClass = registry.getModel(modelName);

    if (!modelClass) {
      functions.logger.warn(`Model ${modelName} is not registered`);
      return;
    }

    const deleteRules = ModelUtil.getDeletionRules(modelClass);
    const ttlRule = deleteRules?.find(
      rule => rule.trigger === 'TTL',
    ) as DeletedByTTL;

    if (!ttlRule) {
      return;
    }

    const repo = new FirestoreDeletionRepo(TODELETE);
    await repo.create({
      id: TODELETE.genId(modelName, snapshot.id),
      modelId: snapshot.id,
      modelName: modelName,
      deleteAt: (data.createdAt || Date.now()) + ttlRule.ttlInSecs * 1000,
      status: 'INIT',
    });
  });

// Register OnDelete trigger handler.
// When a document is deleted, enqueue a subgraph deletion job.
// - NOTE: Nested subcollections not supported.
// - `.runWith({failurePolicy: true})` enables retries till successful (over 7 day window)
//    https://firebase.google.com/docs/functions/retries#enabling_and_disabling_retries
export const runOnDocDelete = functions
  .runWith({failurePolicy: true})
  .firestore.document(triggerPath)
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    const collection = snapshot.ref.parent;
    const modelName = collection.id;
    const modelClass = registry.getModel(modelName);

    if (modelName === ModelUtil.getName(TODELETE)) {
      // TODELETE is a leaf node. No need to run graph deletion.
      return;
    }

    if (modelName === ModelUtil.getName(DELETED)) {
      // Data permanently deleted. Delete external resources permanetly too.
      const data = snapshot.data();
      await queue.enqueue({
        type: 'startExternalDeletion',
        input: {
          modelName: data.modelName,
          modelId: data.modelId,
          // Data no longer in DB, so need to pass in `modelData` to the job
          modelData: data.modelData,
          deletePermanetly: true,
        },
      });
      // DELETED is a leaf node. No need to run graph deletion.
      return;
    }

    if (!modelClass) {
      functions.logger.warn(`Model ${modelName} is not registered`);
      return;
    }

    const DELETED_REPO = new FirestoreDeletionRepo(DELETED);
    const newDeleted = await FirestoreDeletionRepo.runWithTransaction(
      async txn => {
        const DELETED_REPO_TXN = DELETED_REPO.useTransaction(txn);
        const deletedId = DELETED.genId(modelName, snapshot.id);
        const deleted = await DELETED_REPO_TXN.get(deletedId);
        if (deleted) {
          return;
        }
        return await DELETED_REPO_TXN.create({
          id: deletedId,
          modelId: snapshot.id,
          modelName: modelName,
          modelData: toRepoRepresentation(modelClass, data),
          reasons: [REASON_ROOT],
          status: 'INIT',
        });
      },
    );

    if (newDeleted) {
      await queue.enqueue({
        type: 'startGraphDeletion',
        input: {modelName, modelId: snapshot.id},
      });
      await queue.enqueue({
        type: 'startExternalDeletion',
        input: {modelName, modelId: snapshot.id, deletePermanetly: false},
      });
    }
  });

// Register a cron job to schedule TTL deletion
export const cronScanTODELETE = functions.pubsub
  .schedule(deletionConfig.ttlCronSchedule)
  .onRun(async context => {
    const TODELETE_REPO = new FirestoreDeletionRepo(TODELETE);
    const now = Date.now();
    const toDeleteDocs = await TODELETE_REPO.getMany({
      filters: [{field: 'deleteAt', op: '<=', value: now}],
    });
    functions.logger.log(
      `${toDeleteDocs.length} docs expired. Schedule deletion jobs.`,
    );
    toDeleteDocs.forEach(async (toDelete: TODELETE) => {
      await queue.enqueue({
        type: 'initiateDeletion',
        input: {
          modelName: toDelete.modelName,
          modelId: toDelete.modelId,
          reason: REASON_ROOT,
        },
      });
      await TODELETE_REPO.delete(toDelete.id);
    });
  });

// Get deletion graph
export const getGraph = registerHandler(
  API_DELETION_GET_GRAPH,
  async () => {
    return graph.getGraph();
  },
  {
    allowedRoles: [Role.ADMIN, Role.DEV],
  },
);

// Kick off an individual deletion job
export const runJob = registerHandler(
  API_DELETION_RUN_JOB,
  async (job: JobData) => {
    functions.logger.log('Run job:', JSON.stringify(job));
    const fn = worker[job.type];
    if (!fn) {
      throw new Error(`${job.type} fn not found.`);
    }
    try {
      return await fn.bind(worker)(job.input);
    } catch (err: any) {
      functions.logger.error(err);
      throw err;
    }
  },
  {
    allowedRoles: [Role.ADMIN, Role.DEV],
  },
);

export const dryrunDeletion = registerHandler(
  API_DELETION_DRYRUN_DELETION,
  async input => {
    const localQueue = new LocalQueue();
    const jobOptions: JobOptions = {dryrun: true};
    const dryrunRegistry = new RegistryWrapper(jobOptions);
    const worker = new DeletionWorker(localQueue, dryrunRegistry);
    await localQueue.enqueue(
      {
        type: 'initiateDeletion',
        input: {
          modelName: input.modelName,
          modelId: input.modelId,
          reason: REASON_ROOT,
        },
      },
      jobOptions,
    );

    await localQueue.runQueue(worker);
    const dryrunDELETEDStore: Record<string, DELETED> =
      dryrunRegistry.registryOfChoice
        // @ts-ignore
        .getStoreMap()
        .get(ModelUtil.getName(DELETED))!;
    return Object.values(dryrunDELETEDStore).map((obj: DELETED) =>
      toDatastoreRepresentation(obj.modelData),
    );
  },
  {
    allowedRoles: [Role.ADMIN, Role.DEV],
    timeoutSecs: 300, // 5mins
  },
);

export const dryrunRestoration = registerHandler(
  API_DELETION_DRYRUN_RESTORATION,
  async input => {
    const localQueue = new LocalQueue();
    const jobOptions: JobOptions = {dryrun: true};
    const dryrunRegistry = new RegistryWrapper(jobOptions);
    const worker = new DeletionWorker(queue, dryrunRegistry);
    await localQueue.enqueue(
      {
        type: 'initiateRestoration',
        input: {
          modelName: input.modelName,
          modelId: input.modelId,
          reason: REASON_ROOT,
        },
      },
      jobOptions,
    );

    await localQueue.runQueue(worker);
    const results: any[] = [];
    dryrunRegistry.registryOfChoice
      // @ts-ignore
      .getStoreMap()
      .forEach((store: Record<string, BaseModel>, modelName: string) => {
        if (
          modelName == ModelUtil.getName(DELETED) ||
          modelName == ModelUtil.getName(TODELETE)
        ) {
          return;
        }
        Object.values(store).forEach(obj =>
          results.push(toDatastoreRepresentation(obj)),
        );
      });

    return results;
  },
  {
    allowedRoles: [Role.ADMIN, Role.DEV],
    timeoutSecs: 300, // 5mins
  },
);
