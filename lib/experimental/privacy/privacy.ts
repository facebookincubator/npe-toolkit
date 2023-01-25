/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Context} from '@toolkit/data/pads/context';
import {BaseModel, ModelClass, ModelUtil} from '@toolkit/data/pads/model';
import registry from '@toolkit/data/pads/registry';
import {isJsModelType, isModelRefType} from '@toolkit/data/pads/schema';
import {getElementType, ID} from '@toolkit/data/pads/utils';

/**
 * @Privacy decorator to set privacy rules for a Model class
 *
 * Privacy Rule = <Permission, Condition | Condition[]>
 * Conditions in a `Condition[]` array are disjunctive (OR). To make a conjunctive Condition, use `AndCondition` class.
 *
 * e.g.
 * [Condition1, Condition2] => Condition1 || Condition2
 * [And(Condition1, Condition2), Condition3] => (Condition1 && Condition2) || Condition3
 */
export function Privacy<M extends BaseModel>(
  privacy: Partial<Record<Permission, Condition<M> | Condition<M>[]>>,
): any {
  return function (modelClass: ModelClass<M>): ModelClass<M> {
    const meta = ModelUtil.getModelClassMeta(modelClass);
    // @ts-ignore Add privacy in as a real field once we enable privacy
    meta.privacy = Object.fromEntries(
      Object.entries(privacy).map(([k, v]) => {
        return Array.isArray(v) ? [k, v] : [k, [v]];
      }),
    );
    return modelClass;
  };
}

export type PrivacyRules = Partial<Record<Permission, Condition[]>>;
export type Permission = PermissionGroup | PermissionIndividual;
type PermissionGroup =
  | '*' // READ | WRITE
  | 'READ' // GET | LIST
  | 'WRITE'; // CREATE | UPDATE | DELETE
type PermissionIndividual = 'GET' | 'LIST' | 'CREATE' | 'UPDATE' | 'DELETE';

export type EvalInput<M extends BaseModel = BaseModel> = {
  ctx: Context;
  obj?: M;
  // TBD
  // mutation?: Mutation,
};

// Util types
type TypeOrReturnTypeFn<T> = T | ((input?: EvalInput<any>) => T);
type KeyOf<M> = Extract<keyof M, string>;

// Condition interface
export abstract class Condition<M extends BaseModel = BaseModel> {
  abstract eval(mClass: ModelClass<M>, input: EvalInput<M>): Promise<boolean>;
}

// Make a conjunctive condition
export class _AndCondition<M extends BaseModel> extends Condition<M> {
  readonly conditions: Condition<M>[];
  constructor(...conditions: (Condition<M> | Condition<M>[])[]) {
    super();
    // [] is considered as `Or` condition
    this.conditions = conditions.map(c => (Array.isArray(c) ? Or(...c) : c));
  }
  async eval(mClass: ModelClass<M>, input: EvalInput<M>): Promise<boolean> {
    return await evalConjunctive(mClass, this.conditions, input);
  }
}
export const And = <M extends BaseModel>(
  ...conditions: (Condition<M> | Condition<M>[])[]
) => {
  return new _AndCondition(...conditions);
};

// Make a disjunctive condition
export class _OrCondition<M extends BaseModel> extends Condition<M> {
  readonly conditions: Condition<M>[];
  constructor(...conditions: (Condition<M> | Condition<M>[])[]) {
    super();
    // [] is considered as `Or` condition
    this.conditions = conditions.map(c => (Array.isArray(c) ? Or(...c) : c));
  }
  async eval(mClass: ModelClass<M>, input: EvalInput<M>): Promise<boolean> {
    return await evalDisjunctive(mClass, this.conditions, input);
  }
}
export const Or = <M extends BaseModel>(
  ...conditions: (Condition<M> | Condition<M>[])[]
) => {
  return new _OrCondition(...conditions);
};

// Always eval to `true`
export class _AllowAllCondition extends Condition {
  async eval(): Promise<boolean> {
    return true;
  }
}
export const AllowAll = () => {
  return new _AllowAllCondition();
};

// Always eval to `false`
export class _DenyAllCondition extends Condition {
  async eval(): Promise<boolean> {
    return false;
  }
}
export const DenyAll = () => {
  return new _DenyAllCondition();
};

// Check if user is authenticated. i.e. `Context` has uid
export class _AuthedCondition<M extends BaseModel> extends Condition<M> {
  async eval(_: ModelClass<M>, {ctx}: EvalInput): Promise<boolean> {
    return !!ctx.uid;
  }
}
export const Authed = () => {
  return new _AuthedCondition();
};

// Check if the model object field value matches user (uid)
export class _MatchesUserCondition<M extends BaseModel> extends Condition<M> {
  constructor(readonly field: KeyOf<M>) {
    super();
  }
  async eval(_: ModelClass<M>, {ctx, obj}: EvalInput<M>): Promise<boolean> {
    if (!ctx.uid || !obj) return false;
    if (Array.isArray(obj[this.field])) {
      // @ts-ignore
      return obj[this.field].some(
        (v: any) => ctx.uid === v || ctx.uid === v.id,
      );
    } else {
      // @ts-ignore
      return ctx.uid === obj[this.field] || ctx.uid === obj[this.field]?.id;
    }
  }
}
export const MatchesUser = <M extends BaseModel>(field: string) => {
  return new _MatchesUserCondition(field as KeyOf<M>);
};

// Check if a model object with the given ID exists
export class _ExistsCondition<
  M extends BaseModel,
  TargetModel extends BaseModel,
> extends Condition {
  private targetModelClass: ModelClass<TargetModel>;
  constructor(
    readonly targetClassOrFn: TypeOrReturnTypeFn<ModelClass<TargetModel>>,
    readonly idOrFn: TypeOrReturnTypeFn<ID>,
  ) {
    super();
  }
  async eval(_: ModelClass<M>, input: EvalInput<M>): Promise<boolean> {
    const id = this.getTargetId(input);
    typeof this.idOrFn === 'function' ? this.idOrFn(input) : this.idOrFn;
    const mRepo = registry.getRepo(this.getTargetModelClass());
    return !!(await mRepo.get(id));
  }
  getTargetModelClass() {
    if (this.targetModelClass) return this.targetModelClass;
    this.targetModelClass = isJsModelType(this.targetClassOrFn)
      ? this.targetClassOrFn
      : // @ts-ignore
        this.targetClassOrFn();
    return this.targetModelClass;
  }
  getTargetId(input?: EvalInput<M>) {
    return typeof this.idOrFn === 'function' ? this.idOrFn(input) : this.idOrFn;
  }
}
export const Exists = <T extends BaseModel>(
  mClassOfFn: TypeOrReturnTypeFn<ModelClass<T>>,
  idOrFn: TypeOrReturnTypeFn<ID>,
) => {
  return new _ExistsCondition(mClassOfFn, idOrFn);
};

// Check if access is allowed based on the referenced model's privacy rules
// TODO: likely need to optimize runtime perf later
// TODO: handle circular rules....
export class _CanCondition<M extends BaseModel> extends Condition<M> {
  readonly targetClassOrFn?: TypeOrReturnTypeFn<ModelClass<any>>;
  readonly field: string;
  private targetModelClass: ModelClass<any>;
  constructor(
    readonly permission: Permission,
    mClassOrFnOrField: TypeOrReturnTypeFn<ModelClass<any>> | string,
    field?: string,
  ) {
    super();
    if (typeof mClassOrFnOrField === 'function') {
      if (!field) {
        new Error('`field` is required.');
      }
      this.targetClassOrFn = mClassOrFnOrField as TypeOrReturnTypeFn<
        ModelClass<any>
      >;
      this.field = field!;
    } else {
      this.field = mClassOrFnOrField;
    }
  }
  async eval(mClass: ModelClass<M>, {ctx, obj}: EvalInput): Promise<boolean> {
    if (this.targetClassOrFn) {
      // Another Model field referencing this Model
      const tClass = this.getTargetModelClass();
      const tRepo = registry.getRepo(tClass);
      const tObjs = await tRepo
        .query()
        // @ts-ignore
        .filter(`${this.field}.id`, '==', obj!.id)
        .run();
      const tConditions = getConditions(tClass, this.permission);
      if (!tConditions) {
        // TODO: No rule, allow or deny access? deny for now.
        return false;
      }
      const results = await Promise.all(
        tObjs.map(tObj => {
          return evalDisjunctive(tClass, tConditions, {ctx, obj: tObj});
        }),
      );
      return results.every(result => result);
    } else {
      // Current Model field referencing another Model
      const mMeta = ModelUtil.getModelClassMeta(mClass);
      const fType = getElementType(mMeta.schema[this.field].type);
      if (!isModelRefType(fType)) {
        throw new Error(`field ${this.field} is not a ModelRef type.`);
      }
      // @ts-ignore
      const tClass = fType.getModelClass();
      const tRepo = registry.getRepo(tClass);
      // @ts-ignore
      const tId = ModelUtil.getRefId(obj, this.field);
      if (!tId) {
        return true;
      }
      // @ts-ignore
      const tObj = await tRepo.get(tId);
      if (!tObj) {
        return false;
      }
      const tConditions = getConditions(tClass, this.permission);
      if (!tConditions) {
        // TODO: No rule, allow or deny access? deny for now.
        return false;
      }
      return await evalDisjunctive(tClass, tConditions, {ctx, obj: tObj});
    }
  }
  getTargetModelClass() {
    if (this.targetModelClass) return this.targetModelClass;
    this.targetModelClass = isJsModelType(this.targetClassOrFn)
      ? this.targetClassOrFn
      : // @ts-ignore
        this.targetClassOrFn();
    return this.targetModelClass;
  }
}
export const CanRead = (
  mClassOrFnOrField: TypeOrReturnTypeFn<ModelClass<any>> | string,
  field?: string,
) => {
  return new _CanCondition('READ', mClassOrFnOrField, field);
};

export const CanWrite = (
  mClassOrFnOrField: TypeOrReturnTypeFn<ModelClass<any>> | string,
  field?: string,
) => {
  return new _CanCondition('WRITE', mClassOrFnOrField, field);
};

export function getPrivacyRules<T extends BaseModel>(
  c: ModelClass<T>,
): PrivacyRules {
  // @ts-ignore
  return ModelUtil.getModelClassMeta(c)['privacy'];
}

export function getConditions(
  mClass: ModelClass<any>,
  permission: Permission,
): Condition[] | undefined {
  const mPrivacy = getPrivacyRules(mClass);
  if (!mPrivacy) return;
  if (permission === 'GET' || permission === 'LIST') {
    return mPrivacy[permission] ?? mPrivacy['READ'] ?? mPrivacy['*'];
  } else if (
    permission === 'CREATE' ||
    permission === 'UPDATE' ||
    permission === 'DELETE'
  ) {
    return mPrivacy[permission] ?? mPrivacy['WRITE'] ?? mPrivacy['*'];
  } else {
    return mPrivacy[permission] ?? mPrivacy['*'];
  }
}

export async function evalConjunctive<M extends BaseModel>(
  mClass: ModelClass<M>,
  conditions: Condition<M>[],
  input: EvalInput<M>,
) {
  const results = await Promise.all(
    conditions.map(condition => condition.eval(mClass, input)),
  );
  return results.every(result => result);
}

export async function evalDisjunctive<M extends BaseModel>(
  mClass: ModelClass<M>,
  conditions: Condition<M>[],
  input: EvalInput<M>,
) {
  const results = await Promise.all(
    conditions.map(condition => condition.eval(mClass, input)),
  );
  return results.some(result => result);
}

export const evalConditions = evalDisjunctive;
