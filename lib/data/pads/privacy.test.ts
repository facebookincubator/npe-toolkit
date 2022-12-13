/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  test,
  describe,
} from '@jest/globals';

import {Field, Model, BaseModel, ModelUtil, ModelRef} from './model';
import {
  AllowAll,
  And,
  Authed,
  CanRead,
  CanWrite,
  DenyAll,
  evalConditions,
  evalConjunctive,
  evalDisjunctive,
  Exists,
  getConditions,
  MatchesUser,
  Privacy,
} from './privacy';
import {ID} from './utils';
import registry from './registry';

@Model()
class Foo extends BaseModel {}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('set privacy rules', () => {
  test('set privacy - single condition', () => {
    @Model()
    @Privacy({
      '*': AllowAll(),
    })
    class Bar extends BaseModel {}

    const barPrivacy = ModelUtil.getPrivacyRules(Bar);
    expect(barPrivacy).toBeDefined();
    expect(barPrivacy['*']).toEqual([AllowAll()]);
  });

  test('set privacy - condition array', () => {
    @Model()
    @Privacy({
      '*': [Authed(), DenyAll()],
    })
    class Bar extends BaseModel {}

    const barPrivacy = ModelUtil.getPrivacyRules(Bar);
    expect(barPrivacy).toBeDefined();
    expect(barPrivacy['*']).toEqual([Authed(), DenyAll()]);
  });

  test('get conditions - granular permission', () => {
    @Model()
    @Privacy({
      '*': Exists(Foo, '1'),
      READ: Exists(Foo, '2'),
      WRITE: Exists(Foo, '3'),
      GET: Exists(Foo, '4'),
      LIST: Exists(Foo, '5'),
      CREATE: Exists(Foo, '6'),
      UPDATE: Exists(Foo, '7'),
      DELETE: Exists(Foo, '8'),
    })
    class Bar extends BaseModel {}

    expect(getConditions(Bar, '*')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'READ')).toStrictEqual([Exists(Foo, '2')]);
    expect(getConditions(Bar, 'WRITE')).toStrictEqual([Exists(Foo, '3')]);
    expect(getConditions(Bar, 'GET')).toStrictEqual([Exists(Foo, '4')]);
    expect(getConditions(Bar, 'LIST')).toStrictEqual([Exists(Foo, '5')]);
    expect(getConditions(Bar, 'CREATE')).toStrictEqual([Exists(Foo, '6')]);
    expect(getConditions(Bar, 'UPDATE')).toStrictEqual([Exists(Foo, '7')]);
    expect(getConditions(Bar, 'DELETE')).toStrictEqual([Exists(Foo, '8')]);
  });

  test('get conditions - group permission', () => {
    @Model()
    @Privacy({
      '*': Exists(Foo, '1'),
      READ: Exists(Foo, '2'),
      WRITE: Exists(Foo, '3'),
    })
    class Bar extends BaseModel {}

    expect(getConditions(Bar, 'GET')).toStrictEqual([Exists(Foo, '2')]);
    expect(getConditions(Bar, 'LIST')).toStrictEqual([Exists(Foo, '2')]);
    expect(getConditions(Bar, 'CREATE')).toStrictEqual([Exists(Foo, '3')]);
    expect(getConditions(Bar, 'UPDATE')).toStrictEqual([Exists(Foo, '3')]);
    expect(getConditions(Bar, 'DELETE')).toStrictEqual([Exists(Foo, '3')]);
  });

  test('get catchall permission conditions', () => {
    @Model()
    @Privacy({
      '*': Exists(Foo, '1'),
    })
    class Bar extends BaseModel {}

    expect(getConditions(Bar, '*')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'READ')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'WRITE')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'GET')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'LIST')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'CREATE')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'UPDATE')).toStrictEqual([Exists(Foo, '1')]);
    expect(getConditions(Bar, 'DELETE')).toStrictEqual([Exists(Foo, '1')]);
  });
});

describe('eval conditions', () => {
  const evalInputWithUID = {ctx: {uid: '1234'}};
  const evalInputWithoutUID = {ctx: {uid: undefined}};

  test('AllowAll', async () => {
    expect(await evalConditions(Foo, [AllowAll()], evalInputWithoutUID)).toBe(
      true,
    );
  });

  test('DenyAll', async () => {
    expect(await evalConditions(Foo, [DenyAll()], evalInputWithoutUID)).toBe(
      false,
    );
  });

  test('And', async () => {
    expect(
      await evalConditions(
        Foo,
        [And(AllowAll(), AllowAll())],
        evalInputWithoutUID,
      ),
    ).toBe(true);
    expect(
      await evalConditions(
        Foo,
        [And(AllowAll(), DenyAll())],
        evalInputWithoutUID,
      ),
    ).toBe(false);
    expect(
      await evalConditions(
        Foo,
        [And(DenyAll(), AllowAll())],
        evalInputWithoutUID,
      ),
    ).toBe(false);
    expect(
      await evalConditions(
        Foo,
        [And(DenyAll(), DenyAll())],
        evalInputWithoutUID,
      ),
    ).toBe(false);
  });

  test('Authed', async () => {
    expect(await evalConditions(Foo, [Authed()], evalInputWithUID)).toBe(true);
    expect(await evalConditions(Foo, [Authed()], evalInputWithoutUID)).toBe(
      false,
    );
  });

  test('MatchesUser', async () => {
    @Model()
    class Bar extends BaseModel {
      @Field() owner: Foo;
    }

    const bar = {
      id: 'b1234',
      owner: {
        id: 'f1234',
      },
    };

    expect(
      await evalConditions(Bar, [MatchesUser('owner')], {
        ctx: {uid: 'f1234'},
        obj: bar,
      }),
    ).toBe(true);
    expect(
      await evalConditions(Bar, [MatchesUser('owner')], {
        ctx: {uid: 'f4567'},
        obj: bar,
      }),
    ).toBe(false);
  });

  test('Exists', async () => {
    jest.spyOn(registry, 'getRepo').mockImplementation(mNameOrClass => {
      const mName =
        typeof mNameOrClass === 'string'
          ? mNameOrClass
          : ModelUtil.getName(mNameOrClass);
      if (mName === 'Bar') {
        return {
          get: (id: ID) => {
            if (id === 'b1234') {
              return {id};
            }
            return null;
          },
        };
      } else {
        throw new Error('Not supported');
      }
    });

    @Model()
    class Bar extends BaseModel {}

    expect(
      await evalConditions(Foo, [Exists(Bar, 'b1234')], evalInputWithoutUID),
    ).toBe(true);

    expect(
      await evalConditions(Foo, [Exists(Bar, 'b5678')], evalInputWithoutUID),
    ).toBe(false);
  });

  test('CanRead/CanWrite - Current Model field', async () => {
    jest.spyOn(registry, 'getRepo').mockImplementation(mNameOrClass => {
      const mName =
        typeof mNameOrClass === 'string'
          ? mNameOrClass
          : ModelUtil.getName(mNameOrClass);
      if (mName === 'Faz') {
        return {
          get: (id: ID) => {
            if (id === 'faz1234') {
              return {id};
            }
            return null;
          },
        };
      }
    });

    @Model()
    @Privacy({
      READ: AllowAll(),
      WRITE: DenyAll(),
    })
    class Faz extends BaseModel {}

    @Model()
    class Baz extends BaseModel {
      @Field() faz: Faz;
    }

    const evalInputBaz = {
      ctx: {uid: undefined},
      obj: {
        id: 'baz1234',
        faz: {
          id: 'faz1234',
        },
      } as Baz,
    };
    expect(await evalConditions(Baz, [CanRead('faz')], evalInputBaz)).toBe(
      true,
    );
    expect(await evalConditions(Baz, [CanWrite('faz')], evalInputBaz)).toBe(
      false,
    );
  });

  test('CanRead/CanWrite - Another Model field', async () => {
    jest.spyOn(registry, 'getRepo').mockImplementation(mNameOrClass => {
      const mName =
        typeof mNameOrClass === 'string'
          ? mNameOrClass
          : ModelUtil.getName(mNameOrClass);
      if (mName === 'Baz') {
        return {
          query: () => {
            const q = {
              filter: () => q,
              run: () => [
                {
                  id: 'baz1234',
                },
              ],
            };
            return q;
          },
        };
      } else {
        throw new Error('Not supported');
      }
    });

    @Model()
    class Faz extends BaseModel {}

    @Model()
    @Privacy({
      READ: DenyAll(),
      WRITE: AllowAll(),
    })
    class Baz extends BaseModel {
      @Field() faz: Faz;
    }

    const evalInputFaz = {
      ctx: {uid: undefined},
      obj: {
        id: 'faz1234',
      } as Faz,
    };
    expect(await evalConditions(Faz, [CanRead(Baz, 'faz')], evalInputFaz)).toBe(
      false,
    );
    expect(
      await evalConditions(Faz, [CanWrite(Baz, 'faz')], evalInputFaz),
    ).toBe(true);
  });

  test('evalConjunctive', async () => {
    expect(
      await evalConjunctive(Foo, [AllowAll(), AllowAll()], evalInputWithoutUID),
    ).toBe(true);
    expect(
      await evalConjunctive(Foo, [AllowAll(), DenyAll()], evalInputWithoutUID),
    ).toBe(false);
    expect(
      await evalConjunctive(Foo, [DenyAll(), AllowAll()], evalInputWithoutUID),
    ).toBe(false);
    expect(
      await evalConjunctive(Foo, [DenyAll(), DenyAll()], evalInputWithoutUID),
    ).toBe(false);
  });

  test('evalDisjunctive', async () => {
    expect(
      await evalDisjunctive(Foo, [AllowAll(), AllowAll()], evalInputWithoutUID),
    ).toBe(true);
    expect(
      await evalDisjunctive(Foo, [AllowAll(), DenyAll()], evalInputWithoutUID),
    ).toBe(true);
    expect(
      await evalDisjunctive(Foo, [DenyAll(), AllowAll()], evalInputWithoutUID),
    ).toBe(true);
    expect(
      await evalDisjunctive(Foo, [DenyAll(), DenyAll()], evalInputWithoutUID),
    ).toBe(false);
  });
});
