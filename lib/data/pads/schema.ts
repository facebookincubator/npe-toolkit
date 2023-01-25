/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, ModelClass, ModelRef, ModelUtil} from './model';
import * as utils from './utils';

/**
 * PADS Schema
 *
 * Schema is a language-agnostic representation of a Model.
 * It consists of one or more Fields (name + type).
 *
 * Field Types:
 *  - Scalar: Int, Float, String, Bool (, ID)
 *  - Collection: Array, Map
 *  - Reference: Model (, Blob)
 *
 *  Array can have Scalar or Reference type elements.
 *  Map can have {key: string, value: Scalar | Array<Scalar>} elements.
 *
 * For convenience, programming language (primivitve+) types can be auto-converted to PADS types.
 * e.g.
 *  - JS primitive types (Number, String, Boolean) map to PADS types (Float, String, Bool)
 *  - JS Model type maps to PADS ModelRef<Model>
 *
 * (JS Array type can't be auto-converted as PADS Array type requires an element type)
 *
 * NOTE
 * We may map PADS types to or use GraphQL or some other existing SDL types in the future.
 *
 */

function isJsPrimitiveType(jsType: any): boolean {
  return jsType === Number || jsType === String || jsType === Boolean;
}

// function isJsArrayType(jsType: any): boolean {
//   return jsType === Array;
// }

export function isJsModelType(jsType: any): boolean {
  return utils.isInPrototypeChain(jsType.prototype, BaseModel.prototype);
}

export function getSchemaType(jsType: any): Type<unknown> | undefined {
  if (isJsPrimitiveType(jsType)) return mapJsTypeToScalarType(jsType)!;
  if (isJsModelType(jsType)) return new ModelRefType(jsType);
  return undefined;
}

export function isSchemaType(type: unknown): boolean {
  return type instanceof Type;
}

export function mapJsTypeToScalarType(
  jsType: any,
): ScalarType<Number | String | Boolean> | undefined {
  switch (jsType) {
    case String:
      return TString;
    case Boolean:
      return TBool;
    case Number:
      // Map JS Number to PADS Float (vs Int)
      return TFloat;
    default:
      return undefined;
  }
}

export function mapScalarTypeToJsType(
  sType: ScalarType<Number | String | Boolean>,
): JsPrimativeType | undefined {
  switch (sType) {
    case TString:
      return String;
    case TBool:
      return Boolean;
    case TFloat:
    case TInt:
      // Default to Float if not specified
      return Number;
    default:
      return undefined;
  }
}

// TDB
// type TypeOptions = {
//   //   required?: boolean;
// };

export abstract class Type<TInt = unknown, TRaw = TInt> {
  abstract toRawData(t: TInt): TRaw;
  abstract fromRawData(d: TRaw): TInt;
}

class ScalarType<T extends Number | String | Boolean> extends Type<T> {
  constructor(
    private name: string, // private options: Readonly<TypeOptions>,
  ) {
    super();
  }
  toRawData(v: T): T {
    return v;
  }
  fromRawData(r: T): T {
    return r;
  }
  toString(): string {
    return this.name;
  }
}

type RefRaw = {
  id: string;
  type: string;
};
// TODO if we store with the schema ver, many not need to store these
type ModelRefRaw = RefRaw & {
  name: string;
  type: 'ModelRef';
};

class ModelRefType<M extends BaseModel> extends Type<
  M | ModelRef<M> | undefined,
  ModelRefRaw | undefined
> {
  protected modelClass: ModelClass<M> | undefined;
  constructor(
    protected modelClassOrFn: TypeOrFnReturnsType<ModelClass<M>>, // private options: Readonly<TypeOptions>,
  ) {
    super();
    if (isJsModelType(this.modelClassOrFn))
      this.modelClass = this.modelClassOrFn as ModelClass<M>;
  }
  public getModelClass() {
    if (this.modelClass) {
      return this.modelClass;
    } else {
      // @ts-ignore
      return (this.modelClass = this.modelClassOrFn());
    }
  }
  toRawData(m: M | ModelRef<M>): ModelRefRaw | undefined {
    this.getModelClass();
    if (!m || !m.id) return;
    return {
      type: 'ModelRef',
      name: ModelUtil.getName(this.modelClass!),
      id: m.id,
    } as any as ModelRefRaw;
  }
  fromRawData(r: ModelRefRaw): ModelRef<M> | undefined {
    this.getModelClass();
    if (!r || !r.id) return;
    return new ModelRef(
      r.id,
      ModelUtil.getName(this.modelClass!),
      this.modelClass!,
    );
  }
}

class InverseModelRefType<M extends BaseModel> extends ModelRefType<M> {
  constructor(
    protected modelClassOrFn: TypeOrFnReturnsType<ModelClass<M>>,
    protected field: keyof M, // private options: Readonly<TypeOptions>,
  ) {
    super(modelClassOrFn);
  }
  public getField() {
    return this.field;
  }
  toRawData() {
    return undefined;
  }
  fromRawData() {
    return undefined;
  }
}

class ArrayType<T extends Type> extends Type<Array<T>, Array<unknown>> {
  private elemType: T | undefined;
  constructor(
    private elemTypeOrFn: TypeOrFnReturnsType<
      T | JsPrimativeType | JsModelType
    >, // private options: Readonly<TypeOptions>,
  ) {
    super();
  }
  public getElementType() {
    if (!this.elemType) {
      if (
        typeof this.elemTypeOrFn === 'function' &&
        !isJsModelType(this.elemTypeOrFn)
      ) {
        // @ts-ignore
        this.elemTypeOrFn = this.elemTypeOrFn();
      }
      if (isSchemaType(this.elemTypeOrFn))
        // @ts-ignore
        this.elemType = this.elemTypeOrFn;
      else {
        // @ts-ignore
        this.elemType = getSchemaType(this.elemTypeOrFn);
      }
      if (!this.elemType)
        throw Error(`Invalid Array element type ${this.elemTypeOrFn}`);
    }
    return this.elemType;
  }
  toRawData(a: Array<T>): Array<unknown> {
    this.getElementType();
    return a.map(e => this.elemType!.toRawData(e));
  }
  fromRawData(r: Array<unknown>): Array<T> {
    this.getElementType();
    return r.map(e => this.elemType!.fromRawData(e) as T);
  }
  toString(): string {
    return `Array<${String(this.elemType)}>`;
  }
}

// TODO: check types from/to
// TBD: typed key, value
// TBD: maybe support nested map
type Map = {[key: string]: JsPrimativeType | Array<JsPrimativeType>};
class MapType extends Type<Map> {
  constructor() {
    // private options: Readonly<TypeOptions>,
    super();
  }
  toRawData(v: Map): Map {
    return JSON.parse(JSON.stringify(v));
  }
  fromRawData(r: Map): Map {
    return JSON.parse(JSON.stringify(r));
  }
  toString(): string {
    return `Map`;
  }
}

/*
----------------------------------
EXPERIMENTAL code below this point
----------------------------------
*/

/**
 * Class for fields on Models that are externally deletable storage stypes.
 * Experimental.
 */
export abstract class ExternalDeletableType<TIn, TOut> extends Type<TIn, TOut> {
  // Called when model is moved to trashbin
  abstract onSoftDelete(fieldValue: any): void;
  // Called when model is deleted permanently
  abstract onHardDelete(fieldValue: any): void;
  // Called when model is restored (i.e. moved out of trashbin)
  abstract onRestore(fieldValue: any): void;
}

type JsPrimativeType = new () => Number | String | Boolean;
type JsModelType = typeof BaseModel;

type TypeOrFnReturnsType<T> = T | (() => T);

export const TID = new ScalarType<String>('ID');
export const TInt = new ScalarType<Number>('Int');
export const TFloat = new ScalarType<Number>('Float');
export const TString = new ScalarType<String>('String');
export const TBool = new ScalarType<Boolean>('Bool');
export const TMap = new MapType();
export const TArray = <T extends Type>(
  elemTypeOrFn: TypeOrFnReturnsType<T | JsModelType | JsPrimativeType>,
) => {
  return new ArrayType(elemTypeOrFn);
};
export const TModel = <T extends BaseModel>(
  modelTypeOrFn: TypeOrFnReturnsType<ModelClass<T>>,
) => {
  return new ModelRefType(modelTypeOrFn);
};

export const TInverseModel = <T extends BaseModel>(
  modelTypeOrFn: TypeOrFnReturnsType<ModelClass<T>>,
  field: keyof T,
) => {
  return new InverseModelRefType(modelTypeOrFn, field);
};

export function isScalarType(t: any): boolean {
  return t instanceof ScalarType;
}
export function isModelRefType(t: any): boolean {
  return t.constructor === ModelRefType;
}

export function isInverseModelRefType(t: any): boolean {
  return t.constructor === InverseModelRefType;
}

export function isArrayType(t: any): boolean {
  return t instanceof ArrayType;
}

if (utils.IS_JEST_TEST) {
  /** @ts-ignore */
  exports.ForTesting = {
    ScalarType,
    ModelRefType,
    InverseModelRefType,
    ArrayType,
    MapType,
  };
}
