/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// @ts-nocheck

import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
// import {Context} from './context';
import * as mongo from './__tests__/testutils_mongo';
import {BaseModel, Field, Model, ModelUtil, R} from './model';
import * as r from './repo';
import {TModel} from './schema';

let aRepo: r.Repo<AModel>;
let bRepo: r.Repo<BModel>;
let cRepo: r.Repo<CModel>;

@Model()
class AModel extends BaseModel {
  @Field()
  n: number;
  @Field()
  s: string;
}

@Model()
class BModel extends BaseModel {
  @Field()
  a: AModel;
  @Field()
  s: string;
}

@Model()
class CModel extends BaseModel {
  @Field()
  b: BModel;
  @Field()
  n: number;
}

beforeAll(async () => {
  const mongod = await mongo.start();
  const uri = mongod.getUri();
  await r.initDb(uri, 'test');
  // console.log('Init test db. mongo uri', uri);
  aRepo = new r.RepoMongo(AModel);
  bRepo = new r.RepoMongo(BModel);
  cRepo = new r.RepoMongo(CModel);
});

afterAll(async () => {
  await mongo.stop();
});

describe('simple crud', () => {
  // Newly created doc
  let testModel: AModel;

  test('create', async () => {
    const tm = new AModel();
    tm.n = 123;
    tm.s = 'test';
    const ntm = await aRepo.create(tm);
    expect(ntm.n).toBe(123);
    expect(ntm.s).toBe('test');
    expect(ntm.id).toBeDefined();
    expect(ntm.createdAt).toBeDefined();
    expect(ntm.updatedAt).toBeDefined();
    testModel = ntm;
  });

  test('get', async () => {
    const tm = await aRepo.get(testModel.id);
    expect(tm.id).toBe(testModel.id);
    expect(tm.n).toBe(testModel.n);
    expect(tm.s).toBe(testModel.s);
    expect(tm.createdAt).toBe(testModel.createdAt);
    expect(tm.updatedAt).toBe(testModel.updatedAt);
  });

  test('update', async () => {
    testModel.n = 234;
    testModel.s = 'test update';
    await aRepo.update(testModel);
    const tm = await aRepo.get(testModel.id);
    expect(tm.id).toBe(testModel.id);
    expect(tm.n).toBe(testModel.n);
    expect(tm.s).toBe(testModel.s);
    expect(tm.createdAt).toBe(testModel.createdAt);
    expect(tm.updatedAt).toBeGreaterThan(testModel.updatedAt);
  });

  test('delete', async () => {
    await aRepo.delete(testModel.id);
    const tm = await aRepo.get(testModel.id);
    expect(tm).toBeNull();
  });
});

describe('query', () => {
  test('filters, orders, limit', async () => {
    const models = [];
    for (let i = 0; i < 5; i++) {
      models.push(
        await aRepo.create(
          AModel._fromRawData({
            n: i,
            s: i.toString(),
          }),
        ),
      );
    }

    let result;

    result = await aRepo.query().filter('n', '<', 0).run();
    expect(result).toHaveLength(0);

    result = await aRepo.query().filter('n', '<=', 1).run();
    expect(result).toHaveLength(2);

    result = await aRepo
      .query()
      .filter('n', '<=', 1)
      .filter('s', '==', '1')
      .run();
    expect(result).toHaveLength(1);

    result = await aRepo.query().filter('n', '<=', 2).order('n', 'asc').run();
    expect(result).toHaveLength(3);
    expect(result[0].n).toBe(0);
    expect(result[2].n).toBe(2);

    result = await aRepo.query().filter('n', '<=', 2).order('n', 'desc').run();
    expect(result).toHaveLength(3);
    expect(result[0].n).toBe(2);
    expect(result[2].n).toBe(0);

    result = await aRepo
      .query()
      .filter('n', '<=', 3)
      .order('n', 'desc')
      .limit(2)
      .run();
    expect(result).toHaveLength(2);
    expect(result[0].n).toBe(3);
    expect(result[1].n).toBe(2);

    result = await aRepo
      .query()
      .filter('n', '<=', 3)
      .order('n', 'desc')
      .limit(2, 1)
      .run();
    expect(result).toHaveLength(2);
    expect(result[0].n).toBe(2);
    expect(result[1].n).toBe(1);
  });
});

describe('edges', () => {
  test('walk edges depth 0/1/2', async () => {
    let a = new AModel();
    a.n = 1;
    a.s = 'aaa';
    a = await aRepo.create(a);

    let b = new BModel();
    b.a = a;
    b.s = 'bbb';
    b = await bRepo.create(b);

    let c = new CModel();
    c.n = 2;
    c.b = b;
    c = await cRepo.create(c);

    const cNoEdge = await cRepo.get(c.id);
    expect(cNoEdge.n).toBe(2);
    expect(cNoEdge.b).toBeUndefined();
    expect(cNoEdge._b.id).toBe(b.id);
    expect(ModelUtil.getRefId(cNoEdge, 'b')).toBe(b.id);

    const cD1Edges = await cRepo.get(c.id, ['b']);
    expect(cD1Edges.n).toBe(2);
    expect(cD1Edges.b.id).toBe(b.id);
    expect(cD1Edges.b.s).toBe('bbb');
    expect(cD1Edges.b.a).toBeUndefined();
    expect(cD1Edges.b._a.id).toBe(a.id);
    expect(ModelUtil.getRefId(cD1Edges.b, 'a')).toBe(a.id);

    const cD2Edges = await cRepo.get(c.id, ['b.a']);
    expect(cD2Edges.n).toBe(2);
    expect(cD2Edges.b.id).toBe(b.id);
    expect(cD2Edges.b.s).toBe('bbb');
    expect(cD2Edges.b.a.id).toBe(a.id);
    expect(cD2Edges.b.a.s).toBe(a.s);
  });

  test('walk inverse edges depth 0/1/2', async () => {
    @Model()
    class XModel extends BaseModel {
      ys: YModel[];
    }

    @Model()
    class YModel extends BaseModel {
      @Field({inverse: {field: 'ys', many: true}})
      x: XModel;
      @Field(TModel(() => ZModel))
      z: R<ZModel>;
    }

    @Model()
    class ZModel extends BaseModel {
      @Field()
      s: string;
    }

    const xRepo = new r.RepoMongo(XModel);
    const yRepo = new r.RepoMongo(YModel);
    const zRepo = new r.RepoMongo(ZModel);

    let x1 = new XModel();
    x1 = await xRepo.create(x1);

    let z1 = new ZModel();
    z1.s = 'zzz';
    z1 = await zRepo.create(z1);

    let y1 = new YModel();
    y1.x = x1;
    y1 = await yRepo.create(y1);

    let y2 = new YModel();
    y2.x = x1;
    y2.z = z1;
    y2 = await yRepo.create(y2);

    const xNoInvEdges = await xRepo.get(x1.id);
    expect(xNoInvEdges.ys).toBeUndefined();
    const xD1InvEdges = await xRepo.get(x1.id, ['ys']);
    expect(xD1InvEdges.ys).toHaveLength(2);
    expect(xD1InvEdges.ys.map(y => y.id).sort()).toEqual([y1.id, y2.id].sort());
    xD1InvEdges.ys.forEach(y => {
      if (y._z) {
        expect(y._z.id).toBe(z1.id);
        expect(y.z).toBeUndefined();
      }
    });
    const xD2InvEdges = await xRepo.get(x1.id, ['ys.z']);
    expect(xD2InvEdges.ys).toHaveLength(2);
    expect(xD2InvEdges.ys.map(y => y.id).sort()).toEqual([y1.id, y2.id].sort());
    xD2InvEdges.ys.forEach(y => {
      if (y._z) {
        expect(y.z.id).toBe(z1.id);
        expect(y.z.s).toBe('zzz');
      }
    });
  });
});

describe('transaction', () => {
  test('single repo txn - sucess', async () => {
    let a1;
    await r.RepoMongo.runWithTransaction(async transaction => {
      const aRepoTxn = aRepo.useTransaction(transaction);
      a1 = new AModel();
      a1.n = 1;
      a1.s = 'a1';
      a1 = await aRepoTxn.create(a1);
    });

    expect(a1.id).toBeDefined();
    const a1p = await aRepo.get(a1.id);
    expect(a1p.id).toBe(a1.id);
    expect(a1p.n).toBe(1);
    expect(a1p.s).toBe('a1');
  });

  test('single repo txn - fail', async () => {
    let a1;
    await expect(async () => {
      await r.RepoMongo.runWithTransaction(async transaction => {
        const aRepoTxn = aRepo.useTransaction(transaction);
        a1 = new AModel();
        a1.n = 1;
        a1.s = 'a1';
        a1 = await aRepoTxn.create(a1);
        throw Error('bad bad error');
      });
    }).rejects.toThrow();

    expect(a1.id).toBeDefined();
    const a1p = await aRepo.get(a1.id);
    expect(a1p).toBeNull();
  });

  test('multi repos txn - success', async () => {
    let a1;
    let b1 = await r.RepoMongo.runWithTransaction(async transaction => {
      const aRepoTxn = aRepo.useTransaction(transaction);
      a1 = new AModel();
      a1.n = 1;
      a1.s = 'a1';
      a1 = await aRepoTxn.create(a1);
      const bRepoTxn = bRepo.useTransaction(transaction);
      return await bRepoTxn.create({s: 'b1', a: a1});
    });

    const a1p = await aRepo.get(a1.id);
    expect(a1p.id).toBe(a1.id);
    expect(a1p.n).toBe(1);
    expect(a1p.s).toBe('a1');
    const b1p = await bRepo.get(b1.id);
    expect(b1p.id).toBe(b1.id);
    expect(b1p.s).toBe('b1');
    expect(b1p._a.id).toBe(a1p.id);
  });

  test('multi repos txn - fail', async () => {
    let a1 = await aRepo.create({n: 1, s: 'a1'});
    let b1;
    await expect(async () => {
      b1 = await r.RepoMongo.runWithTransaction(async transaction => {
        const aRepoTxn = aRepo.useTransaction(transaction);
        a1 = await aRepoTxn.update({id: a1.id, s: 'a2'});
        const bRepoTxn = bRepo.useTransaction(transaction);
        b1 = await bRepoTxn.create({s: 'b1', a: a1});
        throw Error('bad bad error');
      });
    }).rejects.toThrow();

    const a1p = await aRepo.get(a1.id);
    expect(a1p.id).toBe(a1.id);
    expect(a1p.s).toBe('a1');
    const b1p = await bRepo.get(b1.id);
    expect(b1p).toBeNull();
  });
});

// describe('context', () => {
//   test('create with ctx', async () => {
//     let ctx: Context = {
//       uid: 'uid001',
//     };
//     let rWithCtx = aRepo.useContext(ctx);
//     const tm = new AModel();
//     tm.n = 123;
//     tm.s = 'test';
//     const ntm = await rWithCtx.create(tm);
//     expect(ntm.uid).toBe(ctx.uid);
//     expect(ntm.n).toBe(123);
//     expect(ntm.s).toBe('test');
//     expect(ntm.id).toBeDefined();
//     expect(ntm.createdAt).toBeDefined();
//     expect(ntm.updatedAt).toBeDefined();
//   });
// });
