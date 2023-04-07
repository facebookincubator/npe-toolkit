/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-nocheck

import {afterAll, beforeAll, describe, expect, jest, test} from '@jest/globals';
import {
  BaseModel,
  Field,
  InverseField,
  Model,
  ModelRef,
  ModelUtil,
} from './model';
import {ForTesting, TArray, TMap, TModel, TString} from './schema';

describe('base', () => {
  test('create model with no field', () => {
    expect(() => {
      @Model()
      class FooModel extends BaseModel {}
      const schema = ModelUtil.getSchema(FooModel);
      expect(schema.id.type).toBeInstanceOf(ForTesting.ScalarType);
      expect(schema.id.type.toString()).toBe('ID');
      expect(schema.createdAt.type).toBeInstanceOf(ForTesting.ScalarType);
      expect(schema.createdAt.type.toString()).toBe('Int');
      expect(schema.updatedAt.type).toBeInstanceOf(ForTesting.ScalarType);
      expect(schema.updatedAt.type.toString()).toBe('Int');
    }).not.toThrowError();
  });

  test('check `Model` class inheritance', () => {
    @Model()
    class FooModel extends BaseModel {}
    const tm1: FooModel = new FooModel();
    expect(tm1 instanceof FooModel).toBeTruthy();
    expect(tm1 instanceof BaseModel).toBeTruthy();

    @Model()
    class BarModel extends FooModel {}
    const tm2: BarModel = new BarModel();
    expect(tm2 instanceof BarModel).toBeTruthy();
    expect(tm2 instanceof FooModel).toBeTruthy();
    expect(tm2 instanceof BaseModel).toBeTruthy();
  });

  test('check `Model` class names', () => {
    @Model()
    class FooModel extends BaseModel {}
    expect(ModelUtil.getName(FooModel)).toBe('FooModel');

    @Model({name: 'BarModel'})
    class BazModel extends BaseModel {}
    expect(ModelUtil.getName(BazModel)).toBe('BarModel');
  });
});

describe('scalar + model types', () => {
  @Model()
  class FooModel extends BaseModel {
    @Field()
    s_1: string;
    @Field()
    n_1: number;
    s_2: string; // Not part of schema
  }

  @Model()
  class BarModel extends BaseModel {
    @Field()
    s_1: string;
    @Field()
    r_1: FooModel;
  }

  test('check schema', () => {
    const schemaFooModel = ModelUtil.getSchema(FooModel);
    expect(schemaFooModel.s_1.type).toBeInstanceOf(ForTesting.ScalarType);
    expect(schemaFooModel.s_1.type.toString()).toBe('String');
    expect(schemaFooModel.n_1.type).toBeInstanceOf(ForTesting.ScalarType);
    expect(schemaFooModel.n_1.type.toString()).toBe('Float');
    expect(schemaFooModel.s_2).toBeUndefined();

    const schemaBarModel = ModelUtil.getSchema(BarModel);
    expect(schemaBarModel.s_1.type).toBeInstanceOf(ForTesting.ScalarType);
    expect(schemaBarModel.s_1.type.toString()).toBe('String');
    expect(schemaBarModel.r_1.type).toBeInstanceOf(ForTesting.ModelRefType);
    expect(schemaBarModel.r_1.type.getModelClass()).toBe(FooModel);
  });

  test('create a new model obj - no data', () => {
    const tm1: FooModel = new FooModel();
    expect(tm1.s_1).toBeUndefined();
    expect(tm1.s_2).toBeUndefined();
    expect(tm1.n_1).toBeUndefined();
    expect(tm1.id).toBeUndefined();
    expect(tm1.createdAt).toBeUndefined();
    expect(tm1.updatedAt).toBeUndefined();

    const tm2: FooModel = FooModel._fromRawData({});
    expect(tm2.s_1).toBeUndefined();
    expect(tm2.s_2).toBeUndefined();
    expect(tm2.n_1).toBeUndefined();
    expect(tm2.id).toBeUndefined();
    expect(tm2.createdAt).toBeUndefined();
    expect(tm2.updatedAt).toBeUndefined();
  });

  test('create a new model obj - schema fields only', () => {
    const tm1: FooModel = new FooModel();
    tm1.id = 'id0';
    tm1.s_1 = 'test';
    tm1.n_1 = 1;
    expect(tm1.s_1).toBe('test');
    expect(tm1.s_2).toBeUndefined();
    expect(tm1.n_1).toBe(1);
    expect(tm1.id).toBe('id0');
    expect(tm1.createdAt).toBeUndefined();
    expect(tm1.updatedAt).toBeUndefined();

    const tm2: FooModel = FooModel._fromRawData({
      id: 'id0',
      s_1: 'test',
      n_1: 1,
    });
    expect(tm2.s_1).toBe('test');
    expect(tm2.s_2).toBeUndefined();
    expect(tm2.n_1).toBe(1);
    expect(tm2.id).toBe('id0');
    expect(tm2.createdAt).toBeUndefined();
    expect(tm2.updatedAt).toBeUndefined();
  });

  test('create a new model obj - schema and non-schema fields', () => {
    // s_2 is not a model field / not part of schema
    const tm1: FooModel = new FooModel();
    tm1.s_1 = 'test 1';
    tm1.s_2 = 'test 2';
    expect(tm1.s_1).toBe('test 1');
    expect(tm1.s_2).toBe('test 2');

    const tm2: FooModel = FooModel._fromRawData({
      s_1: 'test 1',
      s_2: 'test 2',
    });
    expect(tm2.s_1).toBe('test 1');
    expect(tm2.s_2).toBeUndefined();
  });

  test('convert raw data from/to a model obj', () => {
    const data = {
      id: 'id0',
      s_1: 'test',
      n_1: 1,
    };
    const tm: FooModel = FooModel._fromRawData(data);
    const odata = FooModel._toRawData(tm);
    for (var key in data) {
      expect(odata[key]).toBe(data[key]);
    }
  });

  test('create a new model obj with a ref to another model', () => {
    const foo: FooModel = FooModel._fromRawData({
      id: 'foo0',
      s_1: 'test',
      n_1: 1,
    });

    const bar1: BarModel = new BarModel();
    bar1.r_1 = foo;
    expect(bar1.r_1 instanceof FooModel).toBeTruthy();
    expect(bar1.r_1.id).toBe('foo0');

    const bar2: BarModel = BarModel._fromRawData({
      r_1: {
        id: 'foo0',
      },
    });
    expect(bar2._r_1 instanceof ModelRef).toBeTruthy();
    expect(bar2._r_1.mClass === FooModel).toBeTruthy();
    expect(bar2._r_1.id).toBe('foo0');
    expect(ModelUtil.getRefId(bar2, 'r_1')).toBe('foo0');
    expect(BarModel._toRawData(bar1)).toEqual(BarModel._toRawData(bar2));
  });

  test('create a new JSON-based model', () => {
    const foo1: FooModel = {
      id: 'foo1',
      s_1: 'test 1',
      n_1: 1,
      s_2: 'test 2',
    };

    const data = FooModel._toRawData(foo1);
    const foo2 = FooModel._fromRawData(data);
    expect(foo2.id).toBe(foo1.id);
    expect(foo2.s_1).toBe(foo1.s_1);
    expect(foo2.n_1).toBe(foo1.n_1);
    expect(foo2.s_2).toBeUndefined();
  });
});

describe('array', () => {
  @Model()
  class FooModel extends BaseModel {
    @Field()
    s: string;
  }

  @Model()
  class BarModel extends BaseModel {
    @Field(TArray(TString))
    a_string: string[];
    @Field(TArray(FooModel))
    a_model: FooModel[];
  }

  test('check schema', () => {
    const schemaBarModel = ModelUtil.getSchema(BarModel);
    expect(schemaBarModel.a_string.type).toBeInstanceOf(ForTesting.ArrayType);
    expect(schemaBarModel.a_string.type.getElementType()).toBeInstanceOf(
      ForTesting.ScalarType,
    );
    expect(schemaBarModel.a_string.type.getElementType().toString()).toBe(
      'String',
    );
    expect(schemaBarModel.a_model.type).toBeInstanceOf(ForTesting.ArrayType);
    expect(schemaBarModel.a_model.type.getElementType()).toBeInstanceOf(
      ForTesting.ModelRefType,
    );
    expect(schemaBarModel.a_model.type.getElementType().getModelClass()).toBe(
      FooModel,
    );
  });

  test('create a model obj with array fields', () => {
    const f1 = new FooModel();
    f1.id = 'f1';
    const f2 = new FooModel();
    f2.id = 'f2';

    const b1 = new BarModel();
    b1.a_string = ['a', 'b', 'c'];
    b1.a_model = [f1, f2];

    expect(b1.a_string).toStrictEqual(['a', 'b', 'c']);
    expect(b1.a_model[0].id).toBe('f1');
    expect(b1.a_model[1].id).toBe('f2');

    const b2 = BarModel._fromRawData(BarModel._toRawData(b1));
    expect(b2.a_string).toStrictEqual(['a', 'b', 'c']);
    expect(b2.a_model[0].id).toBe('f1');
    expect(b2.a_model[1].id).toBe('f2');
  });
});

describe('map', () => {
  @Model()
  class FooModel extends BaseModel {
    @Field(TMap)
    data: {[key: string]: any};
  }

  test('check schema', () => {
    const schemaFooModel = ModelUtil.getSchema(FooModel);
    expect(schemaFooModel.data.type).toBeInstanceOf(ForTesting.MapType);
  });

  test('create a model obj with map field', () => {
    const f1 = new FooModel();
    f1.id = 'f1';
    f1.data = {
      a: '1',
      b: '2',
      c: '3',
    };

    const f2 = FooModel._fromRawData(FooModel._toRawData(f1));
    expect(f2.id).toBe(f1.id);
    expect(f2.data).toStrictEqual(f1.data);
  });
});

// TODO: write a test with non-supported value types

// If `A` needs to reference `B` before `B` is initialized,
// instead of referencing the `B` directly, wrap with a function that returns `B`.
describe('circular refs', () => {
  // e.g.
  // `City` is not initialized yet. Wrap with `()=>City` and use `ReturnType/R`
  @Model()
  class Country extends BaseModel {
    @Field(TModel(() => City)) // TODO: allow `()=>Model` input
    capital?: R<City>; // R<City> == ReturnType<()=>City>
  }

  @Model()
  class City extends BaseModel {
    @Field()
    country?: Country;
  }

  test('check schema', () => {
    const schemaCountry = ModelUtil.getSchema(Country);
    expect(schemaCountry.capital.type).toBeInstanceOf(ForTesting.ModelRefType);
    expect(schemaCountry.capital.type.getModelClass()).toBe(City);
  });

  test('create model objs with circular refs', () => {
    const a1 = new Country();
    const b1 = new City();
    a1.id = 'a1';
    a1.capital = b1;
    b1.id = 'b1';
    b1.country = a1;
    expect(a1.capital.id).toBe('b1');
    expect(b1.country.id).toBe('a1');

    const a2 = Country._fromRawData(Country._toRawData(a1));
    const b2 = City._fromRawData(City._toRawData(b1));
    expect(a2._capital.id).toBe('b1');
    expect(b2._country.id).toBe('a1');
  });

  test('create model objs from raw data with circular refs', () => {
    const a = Country._fromRawData({
      id: 'a1',
      capital: {
        id: 'b1',
      },
    });
    const b = City._fromRawData({
      id: 'b1',
      country: {
        id: 'a1',
      },
    });
    expect(a._capital instanceof ModelRef).toBeTruthy();
    expect(b._country instanceof ModelRef).toBeTruthy();
    expect(a._capital.id).toBe('b1');
    expect(b._country.id).toBe('a1');
  });
});

// `A` stores a reference to `B`.
// And we want to be able to fetch `A`s from `B` without store `A` refs in `B`.
describe('shadow/inverse edges', () => {
  @Model()
  class Continent extends BaseModel {
    // Use @InverseField to mark a shadow/inverse field.
    // InverseField will not be stored in DB.
    @InverseField() countries?: R<Country>[];
  }

  @Model()
  class Country extends BaseModel {
    // Use @InverseField to mark a shadow/inverse field.
    // InverseField will not be stored in DB.
    @InverseField() capital: R<City>;
    // Set a ref and an inverse relationship to `Continent.countries`
    @Field({inverse: {field: 'countries', many: true}})
    continent: Continent;
  }

  @Model()
  class City extends BaseModel {
    // Set a ref and an inverse relationship to `Country.capital`
    @Field({inverse: {field: 'capital'}})
    country: Country;
  }

  test('check schema', () => {
    const schemaContinent = ModelUtil.getSchema(Continent);
    expect(schemaContinent.countries.type).toBeInstanceOf(ForTesting.ArrayType);
    expect(schemaContinent.countries.type.getElementType()).toBeInstanceOf(
      ForTesting.InverseModelRefType,
    );
    expect(
      schemaContinent.countries.type.getElementType().getModelClass(),
    ).toBe(Country);

    const schemaCountry = ModelUtil.getSchema(Country);
    expect(schemaCountry.continent.type).toBeInstanceOf(
      ForTesting.ModelRefType,
    );
    expect(schemaCountry.continent.type.getModelClass()).toBe(Continent);
    expect(schemaCountry.capital.type).toBeInstanceOf(
      ForTesting.InverseModelRefType,
    );
    expect(schemaCountry.capital.type.getModelClass()).toBe(City);
  });

  // TODO
  test('inverse edges', () => {});
});
