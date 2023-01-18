/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// //@ts-nocheck

import {
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  expect,
  test,
  describe,
} from '@jest/globals';

import {DeletedBy, TTL, TODELETE, DELETED, Ref, REASON_ROOT} from './deletion';
import {buildGraph} from './deletion.graph';
import {
  DeletionWorker,
  ForTesting,
  JobOptions,
  LocalQueue,
  RegistryWrapper,
} from './deletion.workflow';
import {BaseModel, Field, Model, ModelClass, ModelUtil} from './model';
import registry, {initRegistry} from './registry';
import * as repo from './repo';
import {TArray} from './schema';
import * as mongo from './__tests__/testutils_mongo';

let db;
let DELETED_REPO: repo.Repo<DELETED>;
let TODELETE_REPO: repo.Repo<TODELETE>;

beforeAll(async () => {
  initRegistry(repo.RepoMongoWithDeletion);
  DELETED_REPO = registry.getRepo(DELETED);
  TODELETE_REPO = registry.getRepo(TODELETE);
  const mongod = await mongo.start();
  const uri = mongod.getUri();
  db = await repo.initDb(uri, 'test');
});

afterAll(async () => {
  await mongo.stop();
});

beforeEach(async () => {
  await db.dropDatabase();
});

describe('out-ref/edge', () => {
  describe('P deleted, delete C', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    @DeletedBy(Ref('p'))
    //@DeletedBy(OutNode('p', 'DELETED'))
    class C extends BaseModel {
      @Field()
      p: P;
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          P: [
            {
              modelName: 'C',
              trigger: 'OUTNODE',
              field: 'p',
              condition: 'DELETED',
            },
          ],
        },
      });
    });

    test('delete out-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([p], {numOfDeletedItems: 2})).toBe(true);
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([c], {numOfDeletedItems: 1})).toBe(true);
    });
  });

  describe('One of Ps deleted, delete C', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    @DeletedBy(Ref('pArray', 'ANY_DELETED'))
    //@DeletedBy(OutNode('pArray', 'ANY_DELETED'))
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    test('check deletion graph', () => {
      const graph = buildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          P: [
            {
              modelName: 'C',
              trigger: 'OUTNODE',
              field: 'pArray',
              condition: 'ANY_DELETED',
            },
          ],
        },
      });
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([c], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete 1 of out-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([p2], {numOfDeletedItems: 2})).toBe(true);
    });
  });

  describe('All Ps deleted, delete C', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    @DeletedBy(Ref('pArray', 'ALL_DELETED'))
    //@DeletedBy(OutNode('pArray', 'ALL_DELETED'))
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          P: [
            {
              modelName: 'C',
              trigger: 'OUTNODE',
              field: 'pArray',
              condition: 'ALL_DELETED',
            },
          ],
        },
      });
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([c], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete 1 of out-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([p2], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete all out-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([p1, p2], {numOfDeletedItems: 3})).toBe(true);
    });
  });
});

describe('in-ref/edge', () => {
  describe('C deleted, delete P', () => {
    @Model()
    @DeletedBy(Ref(() => C, 'p', 'ANY_DELETED'))
    //@DeletedBy(InNode(() => C, 'p', 'ANY_DELETED'))
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field()
      p: P;
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          C: [
            {
              modelName: 'P',
              trigger: 'INNODE',
              field: 'p',
              condition: 'ANY_DELETED',
            },
          ],
        },
      });
    });

    test('delete out-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([p], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([c], {numOfDeletedItems: 2})).toBe(true);
    });

    test('delete 1 of in-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c1 = await cRepo.create({p: p});
      const c2 = await cRepo.create({p: p});

      expect(await testDeletion([c1], {numOfDeletedItems: 2})).toBe(true);
    });
  });

  describe('C deleted, delete P if no more C refs P', () => {
    @Model()
    @DeletedBy(Ref(() => C, 'p', 'ALL_DELETED'))
    //@DeletedBy(InNode(() => C, 'p', 'ALL_DELETED'))
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field()
      p: P;
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          C: [
            {
              modelName: 'P',
              trigger: 'INNODE',
              field: 'p',
              condition: 'ALL_DELETED',
            },
          ],
        },
      });
    });

    test('delete out-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([p], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c = await cRepo.create({p: p});

      expect(await testDeletion([c], {numOfDeletedItems: 2})).toBe(true);
    });

    test('delete 1 of in-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c1 = await cRepo.create({p: p});
      const c2 = await cRepo.create({p: p});

      expect(await testDeletion([c1], {numOfDeletedItems: 1})).toBe(true);
    });

    test('delete all in-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p = await pRepo.create({});
      const c1 = await cRepo.create({p: p});
      const c2 = await cRepo.create({p: p});

      expect(await testDeletion([c1, c2], {numOfDeletedItems: 3})).toBe(true);
    });
  });

  describe('C deleted, delete all Ps', () => {
    @Model()
    @DeletedBy(Ref(() => C, 'pArray', 'ANY_DELETED'))
    // @DeletedBy(InNode(() => C, 'pArray', 'ANY_DELETED'))
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          C: [
            {
              modelName: 'P',
              trigger: 'INNODE',
              field: 'pArray',
              condition: 'ANY_DELETED',
            },
          ],
        },
      });
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([c], {numOfDeletedItems: 3})).toBe(true);
    });

    test('delete 1 of out-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([p2], {numOfDeletedItems: 1})).toBe(true);
    });
  });

  describe('C deleted, delete Ps if no more C refs them', () => {
    @Model()
    @DeletedBy(Ref(() => C, 'pArray', 'ALL_DELETED'))
    // @DeletedBy(InNode(() => C, 'pArray', 'ALL_DELETED'))
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    test('check deletion graph', () => {
      const graph = registerAndBuildGraph(P, C);
      expect(graph).toEqual({
        edges: {
          C: [
            {
              modelName: 'P',
              trigger: 'INNODE',
              field: 'pArray',
              condition: 'ALL_DELETED',
            },
          ],
        },
      });
    });

    test('delete in-node', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([c], {numOfDeletedItems: 3})).toBe(true);
    });

    test('delete 1 of out-nodes', async () => {
      registerAndBuildGraph(P, C);
      const pRepo = registry.getRepo(P);
      const cRepo = registry.getRepo(C);
      const p1 = await pRepo.create({});
      const p2 = await pRepo.create({});
      const c = await cRepo.create({pArray: [p1, p2]});

      expect(await testDeletion([p2], {numOfDeletedItems: 1})).toBe(true);
    });
  });
});

/*
describe('no rule', () => {
  test('P deleted, nothing done on C', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field()
      p: P;
    }

    // Possible dangling ref
    const graph = registerAndBuildGraph();
    expect(graph).toEqual({edges: {}});
  });

  test('C deleted, nothing done on P', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field()
      p: P;
    }

    const graph = registerAndBuildGraph();
    expect(graph).toEqual({edges: {}});
  });

  test('One of Ps deleted, nothing done on C', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    // Possible dangling ref
    const graph = registerAndBuildGraph();
    expect(graph).toEqual({edges: {}});
  });

  test('C deleted, nothing done on Ps', () => {
    @Model()
    class P extends BaseModel {}

    @Model()
    class C extends BaseModel {
      @Field(TArray(P))
      pArray: P[];
    }

    const graph = registerAndBuildGraph();
    expect(graph).toEqual({edges: {}});
  });
});
*/

// TODO: multiple rules

describe('ttl', () => {
  test('ttl set correctly', async () => {
    @Model()
    @DeletedBy(TTL(3600))
    class M extends BaseModel {}

    const mRepo = registry.getRepo(M);
    const m = await mRepo.create({});

    const allToDeleted = await TODELETE_REPO.query().run();
    expect(allToDeleted).toHaveLength(1);
    expect(allToDeleted[0].status).toBe('INIT');
    expect(allToDeleted[0].deleteAt).toEqual(m.createdAt + 3600 * 1000);
  });
});

describe('restore', () => {
  @Model()
  @DeletedBy(Ref(() => C, 'a'))
  class A extends BaseModel {
    @Field() s: string;
  }

  @Model()
  @DeletedBy(Ref('a'))
  class B extends BaseModel {
    @Field() b: boolean;
    @Field() a: A;
  }

  @Model()
  class C extends BaseModel {
    @Field() n: number;
    @Field() a: A;
  }

  test('restore self', async () => {
    registerAndBuildGraph(A, B, C);

    const aRepo = registry.getRepo(A);
    const a = await aRepo.create({s: 'abc'});
    await runDeletion(a);
    expect(await aRepo.get(a.id)).toBeNull();

    expect(await testRestoration([a], {restoredItems: [a]})).toBe(true);
  });

  test('restore self and outnode', async () => {
    registerAndBuildGraph(A, B, C);

    const aRepo = registry.getRepo(A);
    const a = await aRepo.create({s: 'abc'});
    const bRepo = registry.getRepo(B);
    const b = await bRepo.create({b: true, a: a});

    await runDeletion(a);
    expect(await aRepo.get(a.id)).toBeNull();
    expect(await bRepo.get(b.id)).toBeNull();

    expect(await testRestoration([a], {restoredItems: [a, b]})).toBe(true);
  });

  test('restore self and innode', async () => {
    registerAndBuildGraph(A, B, C);

    const aRepo = registry.getRepo(A);
    const a = await aRepo.create({s: 'abc'});
    const cRepo = registry.getRepo(C);
    const c = await cRepo.create({n: 123, a: a});

    await runDeletion(c);
    expect(await aRepo.get(a.id)).toBeNull();
    expect(await cRepo.get(c.id)).toBeNull();

    expect(await testRestoration([c], {restoredItems: [a, c]})).toBe(true);
  });

  test('restore self + outnode + innode', async () => {
    registerAndBuildGraph(A, B, C);

    const aRepo = registry.getRepo(A);
    const a = await aRepo.create({s: 'abc'});
    const bRepo = registry.getRepo(B);
    const b = await bRepo.create({b: true, a: a});
    const cRepo = registry.getRepo(C);
    const c = await cRepo.create({n: 123, a: a});

    await runDeletion(c);
    expect(await aRepo.get(a.id)).toBeNull();
    expect(await bRepo.get(b.id)).toBeNull();
    expect(await cRepo.get(c.id)).toBeNull();

    expect(await testRestoration([c], {restoredItems: [a, b, c]})).toBe(true);
  });

  test('restore with other reasons', async () => {
    registerAndBuildGraph(A, B, C);

    const aRepo = registry.getRepo(A);
    const a = await aRepo.create({s: 'abc'});
    const bRepo = registry.getRepo(B);
    const b = await bRepo.create({b: true, a: a});
    const cRepo = registry.getRepo(C);
    const c = await cRepo.create({n: 123, a: a});

    // Delete `c`
    await runDeletion(c);
    // Delete `a`
    await runDeletion(a);

    expect(await aRepo.get(a.id)).toBeNull();
    expect(await bRepo.get(b.id)).toBeNull();
    expect(await cRepo.get(c.id)).toBeNull();

    // Only c should be restored
    expect(await testRestoration([c], {restoredItems: [c]})).toBe(true);
    const aRestored = await aRepo.get(a.id);
    expect(aRestored).toBeNull();
    const bRestored = await bRepo.get(b.id);
    expect(bRestored).toBeNull();
  });
});

function registerAndBuildGraph(...m: ModelClass<any>[]) {
  registry.register(...m);
  return buildGraph(...m);
}

type DeletionTestResult = {
  numOfDeletedItems: number;
};

// Run deletion tests (dryrun + actual) and check the results
async function testDeletion(
  modelsToDelete: BaseModel[],
  expected: DeletionTestResult,
) {
  // Test dryrun deletion
  const dryrunJobOptions = {dryrun: true};
  const dryrunRegistry = new RegistryWrapper(dryrunJobOptions);
  await Promise.all(
    modelsToDelete.map(modelToDelete =>
      runDeletion(modelToDelete, dryrunJobOptions, dryrunRegistry),
    ),
  );
  await checkDeletionResult(expected, dryrunJobOptions, dryrunRegistry);
  // Test normal deletion
  await Promise.all(
    modelsToDelete.map(modelToDelete => runDeletion(modelToDelete)),
  );
  await checkDeletionResult(expected);
  return true;
}

async function runDeletion<M extends BaseModel>(
  m: M,
  jobOptions?: JobOptions,
  dryrunRegistry?: RegistryWrapper,
) {
  // @ts-ignore
  const modelName = ModelUtil.getName(m.constructor);
  const modelId = m.id;
  const localQueue = new LocalQueue();
  const worker = new DeletionWorker(localQueue, dryrunRegistry);
  await localQueue.enqueue(
    {
      type: 'initiateDeletion',
      input: {modelName, modelId, reason: REASON_ROOT},
    },
    jobOptions,
  );
  await localQueue.runQueue(worker);
  for (const [_, job] of Object.entries(localQueue.getJobStatuses())) {
    expect(job.status).toBe('FINISHED');
  }
}

async function checkDeletionResult(
  expected: DeletionTestResult,
  jobOptions?: JobOptions,
  dryrunRegistry?: RegistryWrapper,
) {
  let allDeleted;
  if (jobOptions?.dryrun) {
    // If dryrun, nothing should be deleted from the actual db
    expect(await DELETED_REPO.query().run()).toHaveLength(0);
    const dryRunDeletedRepo = dryrunRegistry.getRepo(
      DELETED,
    ) as ForTesting.RepoForDryrun<DELETED>;
    allDeleted = Object.values(dryRunDeletedRepo.modelStore);
  } else {
    allDeleted = await DELETED_REPO.query().run();
  }

  expect(allDeleted).toHaveLength(expected.numOfDeletedItems);
  allDeleted.forEach((deleted: DELETED) => {
    expect(deleted.status).toBe('FINISHED');
  });
  return allDeleted;
}
type RestorationTestResult = {
  restoredItems: BaseModel[];
};

async function testRestoration(
  modelsToRestore: BaseModel[],
  expected: RestorationTestResult,
) {
  // Test dryrun restoration
  const dryrunJobOptions = {dryrun: true};
  const dryrunRegistry = new RegistryWrapper(dryrunJobOptions);
  await Promise.all(
    modelsToRestore.map(modelToRestore =>
      runRestoration(
        ModelUtil.getName(modelToRestore.constructor),
        modelToRestore.id,
        dryrunJobOptions,
        dryrunRegistry,
      ),
    ),
  );
  await checkRestorationResult(expected, dryrunJobOptions, dryrunRegistry);
  // Test normal restoration
  await Promise.all(
    modelsToRestore.map(modelToRestore =>
      runRestoration(
        ModelUtil.getName(modelToRestore.constructor),
        modelToRestore.id,
      ),
    ),
  );
  await checkRestorationResult(expected);
  return true;
}

async function runRestoration(
  modelName: string,
  modelId: string,
  jobOptions?: JobOptions,
  dryrunRegistry?: RegistryWrapper,
) {
  const localQueue = new LocalQueue();
  const worker = new DeletionWorker(localQueue, dryrunRegistry);
  await localQueue.enqueue(
    {
      type: 'initiateRestoration',
      input: {modelName, modelId, reason: REASON_ROOT},
    },
    jobOptions,
  );
  await localQueue.runQueue(worker);
  for (const [_, job] of Object.entries(localQueue.getJobStatuses())) {
    expect(job.status).toBe('FINISHED');
  }
}

async function checkRestorationResult(
  expected: RestorationTestResult,
  jobOptions?: JobOptions,
  dryrunRegistry?: RegistryWrapper,
) {
  for (const item of expected.restoredItems) {
    const modelClass = item.constructor as ModelClass<any>;
    const modelName = ModelUtil.getName(modelClass);
    const modelRepo = registry.getRepo(modelClass);
    const dbRestoredItem = await modelRepo.get(item.id);
    const dbDeletedItem = await DELETED_REPO.get(
      DELETED.genId(modelName, item.id),
    );
    if (jobOptions?.dryrun) {
      const modelDryrunRepo = dryrunRegistry.getRepo(
        modelClass,
      ) as ForTesting.RepoForDryrun;
      const modelDryunStore = modelDryrunRepo.modelStore;
      const dryrunRestoredItem = modelClass._fromRawData(
        modelDryunStore[item.id],
      );
      expect(dryrunRestoredItem).toStrictEqual(item);
      expect(dbRestoredItem).toBeNull();
      expect(dbDeletedItem).toBeDefined();
    } else {
      expect(dbRestoredItem).toStrictEqual(item);
      expect(dbDeletedItem).toBeNull();
    }
  }
}
