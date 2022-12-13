/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import 'reflect-metadata';
import type {DeletionRule} from './deletion';
import type {PrivacyRules} from './privacy';
import registry from './registry';
import * as s from './schema';
import {ID} from './utils';

export type R<T> = ReturnType<() => T>; // ReturnType shortcut

type KeyOf<T> = keyof T;
type ValueOf<T> = T[keyof T];

type ModelClassMeta = {
  name?: string;
  schema: SchemaMeta;
  deletions?: DeletionRule[];
  privacy?: PrivacyRules;
};
export type SchemaMeta = Record<
  string,
  {
    type: s.Type;
  }
>;
type ModelInstanceMeta = {
  isDeferred: boolean; // Loading deferred. Model fields (excluding `id`) not available yet.
};
type ModelRawData<T extends BaseModel> = {[key in keyof T]?: any};

export type ModelClass<T extends BaseModel> = new () => T;
// Try again. This did not work well either.
// export interface ModelClass<T extends BaseModel> {
//   new (): T;
//   _fromRawData(data: RawData<T>): T;
// }

export class ModelUtil {
  private static readonly metadataKey = Symbol('metadata');

  static getName<T extends BaseModel>(mClass: ModelClass<T>): string {
    const meta = ModelUtil.getModelClassMeta(mClass);
    return meta.name ?? mClass.name;
  }

  static getRefId<T extends BaseModel>(
    m: T,
    refField: KeyOf<T>,
  ): string | undefined {
    // @ts-ignore
    const fieldVal = m[`_${refField}`] || m[`${refField}`];
    return fieldVal ? fieldVal.id : undefined;
  }

  static getRefIds<T extends BaseModel>(
    m: T,
    refField: KeyOf<T>,
  ): string[] | undefined {
    // @ts-ignore
    const fieldVal = m[`_${refField}`] || m[`${refField}`];
    // @ts-ignore
    return fieldVal ? fieldVal.map(o => o.id) : undefined;
  }

  static getModelClassMeta(t: any): ModelClassMeta {
    // t can be a prototype of Model or Model itself
    const target = t.prototype ? t.prototype : t;
    let meta: ModelClassMeta = Reflect.getOwnMetadata(this.metadataKey, target);
    const targetProto = Object.getPrototypeOf(target);
    if (!meta) {
      // Merge with the parent's
      const pMeta: ModelClassMeta = Reflect.getOwnMetadata(
        this.metadataKey,
        targetProto,
      );
      // Need to deepcopy
      meta = pMeta ? {schema: {...pMeta.schema}} : {schema: {}};
      Reflect.defineMetadata(this.metadataKey, meta, target);
    }
    return meta;
  }

  static getSchema<T extends BaseModel>(c: ModelClass<T>): SchemaMeta {
    // @ts-ignore
    return ModelUtil.getModelClassMeta(c)['schema'];
  }

  static getPrivacyRules<T extends BaseModel>(c: ModelClass<T>): PrivacyRules {
    // @ts-ignore
    return ModelUtil.getModelClassMeta(c)['privacy'];
  }

  static getDeletionRules<T extends BaseModel>(
    c: ModelClass<T>,
  ): DeletionRule[] | undefined {
    // @ts-ignore
    return ModelUtil.getModelClassMeta(c)['deletions'];
  }

  static getModelInstanceMeta<T extends BaseModel>(m: T): ModelInstanceMeta {
    let meta = Reflect.getOwnMetadata(this.metadataKey, m);
    if (!meta) {
      meta = {
        dirtyFields: {},
      };
      Reflect.defineMetadata(this.metadataKey, meta, m);
    }
    return meta;
  }

  static getModelInstanceMetaVal<T extends BaseModel>(
    m: T,
    key: KeyOf<ModelInstanceMeta>,
  ): ValueOf<ModelInstanceMeta> {
    const meta: ModelInstanceMeta = this.getModelInstanceMeta(m);
    return meta[key];
  }

  static setModelInstanceMetaVal<T extends BaseModel>(
    m: T,
    key: KeyOf<ModelInstanceMeta>,
    val: any,
  ): void {
    const meta: ModelInstanceMeta = this.getModelInstanceMeta(m);
    meta[key] = val;
  }
}

type FieldOptions = {
  type?: any;
  inverse?: {
    field: string; // field name in the referenced Model
    many?: boolean; // is the inverse relationship 1-to-1 or 1-to-many?
  };
};

/**
 * (WIP) @InverseField decorator
 * - Annotate an inverse field
 * - Curretly is optional and used for mark/annotation purpose only
 * - (Future) May help simplify @Field inverse options or use in Deletion, or Privacy
 * - TODO: Auto detect type
 */
export function InverseField() {
  return function (target: any, propertyKey: string) {};
}

/**
 * (WIP) @Field decorator
 * - Registers schema field/property
 * - JS/TS reflection provides limited type details (e.g. Array vs Array<String>),
 *   and optionally takes `type` or other (TBD) params.
 */
export function Field(
  typeOrOptions?: s.Type | (() => s.Type) | FieldOptions,
): any {
  const options: FieldOptions =
    s.isSchemaType(typeOrOptions) || typeof typeOrOptions === 'function'
      ? {
          type: typeOrOptions,
        }
      : (typeOrOptions as FieldOptions);
  // export function Field(type?: Schema.Type, options?: FieldOptions): any {
  /**
   * @param target - `ModelClass.prototype`
   * @param propertyKey - a field name
   */
  return function (target: any, propertyKey: string) {
    const meta: ModelClassMeta = ModelUtil.getModelClassMeta(target);

    // Get type of field
    const jsType = Reflect.getMetadata('design:type', target, propertyKey);
    const schemaType = options?.type || s.getSchemaType(jsType);

    if (!s.isSchemaType(schemaType)) {
      throw Error(`Schema type is invalid for field "${propertyKey}"`);
    }

    meta.schema[propertyKey] = {
      type: schemaType,
    };

    // Does a ModelRefType field have an inverse field?
    if (s.isModelRefType(schemaType) && options?.inverse) {
      const refModel = schemaType.getModelClass();
      const refModelSchema: SchemaMeta = ModelUtil.getSchema(refModel);
      //@ts-ignore
      const invType = s.TInverseModel(target.constructor, propertyKey);
      if (refModelSchema[options.inverse.field]) {
        throw Error(
          `Inverse field "${options?.inverse.field}" of ${ModelUtil.getName(
            refModel,
          )} is already registered.`,
        );
      }
      refModelSchema[options?.inverse.field] = {
        type: options.inverse.many ? s.TArray(invType) : invType,
      };
      initField(refModel.prototype, options?.inverse.field);
    }
    // console.log(`schema`, meta.schema);
    return initField(target, propertyKey);
  };

  function initField(target: any, propertyKey: string) {
    // WARN: `tsc` and `babel-ts/esXXX` do things inconsistently. Test with both
    // (`babel` inits with `undefined`, `tsc` does not)
    // Init to `undefined`
    target[propertyKey] = undefined;

    // Set up getters/setters
    // (`babel`: need to return a descriptor without `initializer`, `tsc`: can define directly here using `Object.defineProperty`)
    //  - Adds shadow fields
    const pd = {
      get: function (): any {
        // TODO: look up once
        // const meta: ModelInstanceMeta = ModelUtil.getModelInstanceMeta(this);
        // if (meta.isDeferred) {
        //   throw Error(
        //     // @ts-ignore
        //     `${ModelUtil.getName(this.constructor)}(${this._id}) is not loaded`,
        //   );
        // }
        // @ts-ignore
        const val = this[`_${propertyKey}`];
        if (val instanceof ModelRef) {
          return undefined;
        }
        return val;
      },
      set: function (v: any) {
        // @ts-ignore
        this[`_${propertyKey}`] = v;
      },
    };
    Object.defineProperty(target, propertyKey, pd);
    return pd;
  }
}

type ModelOptions = {
  name?: string;
  deletions?: DeletionRule[];
};
/**
 * (WIP) @Model decorator
 */
export function Model(options?: ModelOptions): any {
  return function (origClass: any): typeof origClass {
    const meta = ModelUtil.getModelClassMeta(origClass);
    if (options?.name) {
      meta.name = options.name;
    }
    if (options?.deletions) {
      meta.deletions = options?.deletions;
    }
    registry.register(origClass);
    return origClass;
  };
}

export abstract class BaseModel {
  @Field({type: s.TID})
  id: ID;
  @Field({type: s.TInt})
  createdAt?: number;
  @Field({type: s.TInt})
  updatedAt?: number;

  // public static getRepo<T extends BaseModel>(this: ModelClass<T>): Repo<T> {
  //   // @ts-ignore
  //   return repo_registry[ModelUtil.getName(this)];
  // }

  public static _fromRawData<T extends BaseModel>(
    this: ModelClass<T>,
    data: ModelRawData<T>,
    options?: {isDeferred?: boolean},
  ): T {
    const m = new this();
    const schema = ModelUtil.getSchema(this);
    for (let key in data) {
      if (key in schema) {
        // Set the shadow field (i.e. `_${fieldname}`) directly
        // @ts-ignore
        m[`_${key}`] = schema[key].type.fromRawData(data[key]);
      }
    }
    if (options?.isDeferred)
      // @ts-ignore
      ModelUtil.setModelInstanceMetaVal(m, 'isDeferred', options?.isDeferred);

    return m;
  }

  public static _toRawData<T extends BaseModel>(
    this: ModelClass<T>,
    m: T,
  ): ModelRawData<T> {
    const schema = ModelUtil.getSchema(this);
    const data: ModelRawData<T> = {};
    for (let key in schema) {
      // @ts-ignore
      if (m[`_${key}`] !== undefined)
        // @ts-ignore
        data[key] = schema[key].type.toRawData(m[`_${key}`]);
      // @ts-ignore
      else if (m[`${key}`] !== undefined) {
        // To support a pure JSON model object
        // @ts-ignore
        data[key] = schema[key].type.toRawData(m[`${key}`]);
      }
    }
    return data;
  }
}

export class ModelRef<T extends BaseModel> {
  constructor(
    readonly id: ID,
    readonly name: string,
    readonly mClass: ModelClass<T>,
  ) {}
}
