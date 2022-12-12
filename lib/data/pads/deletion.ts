/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {BaseModel, Field, Model, ModelClass, ModelUtil} from './model';
import {TArray, TID, TInt, TMap, TString} from './schema';
import {ID} from './utils';

/**
 * @DeletedBy decorator
 * - Register one or more Deletion rules to the decorated Model
 *
 */
export function DeletedBy(...deletions: DeletionRule[]): any {
  return function (modelClass: any): typeof modelClass {
    const meta = ModelUtil.getModelClassMeta(modelClass);
    if (!meta.deletions) meta.deletions = [];
    meta.deletions.push(...deletions);
    return modelClass;
  };
}

export type DeletionRule =
  | DeletedByInNode<any>
  | DeletedByOutNode<any>
  | DeletedByTTL;

export type DeleteTrigger = 'OUTNODE' | 'INNODE' | 'TTL';

export type DeleteCondition =
  | 'DELETED' // For out-edge non-array fields (default)
  | 'ANY_DELETED' // For out-edge array fields or in-edge fields
  | 'ALL_DELETED'; // For out-edge array fields or in-edge fields

type FieldOf<T> = Extract<keyof T, string>;

export function Ref<M extends BaseModel>(
  fieldOrModel: string | ModelClass<M> | (() => ModelClass<M>),
  fieldOrCondition?: string | DeleteCondition,
  condition?: DeleteCondition,
): DeletionRule {
  // TODO: add validation
  if (typeof fieldOrModel === 'string') {
    return OutNode(fieldOrModel, fieldOrCondition as DeleteCondition);
  } else {
    return InNode(fieldOrModel, fieldOrCondition as FieldOf<M>, condition);
  }
}

// LATER: A few future extension ideas
// Support AND
//  - ex. DELETE if both outnode u AND p are DELETED => DeletedBy(OutNode(['u','p']))
//  - OR works already like this. DeletedBy(OutNode('u'), OutNode('p'))
// Support CATCH_ALL *
// - DeletedBy(OutNode('*'))

// DeletedByOutNode: DELELE ME if out-node object(s) I referenced with {FIELD} is {DELETE_CONDITION}
type DeletedByOutNode<ThisModel extends BaseModel> = {
  trigger: 'OUTNODE';
  field: FieldOf<ThisModel>;
  condition: DeleteCondition;
};

export function OutNode<ThisModel extends BaseModel>(
  field: FieldOf<ThisModel>,
  condition?: DeleteCondition,
): DeletedByOutNode<ThisModel> {
  return {
    trigger: 'OUTNODE',
    field: field,
    condition: condition ?? 'DELETED',
  };
}

// DeletedByInNode: DELELE ME if {MODEL} object(s) who references me with {FIELD} is {DELETE_CONDITION}
export type DeletedByInNode<OtherModel extends BaseModel> = {
  trigger: 'INNODE';
  model: ModelClass<OtherModel> | (() => ModelClass<OtherModel>);
  field: FieldOf<OtherModel>;
  condition: DeleteCondition;
};

export function InNode<OtherModel extends BaseModel>(
  modelOrFn: ModelClass<OtherModel> | (() => ModelClass<OtherModel>),
  field: FieldOf<OtherModel>,
  condition?: DeleteCondition,
): DeletedByInNode<OtherModel> {
  return {
    trigger: 'INNODE',
    model: modelOrFn,
    field,
    condition: condition ?? 'ALL_DELETED',
  };
}

// DeletedByTTL: DELETE ME after {TTL} seconds
export type DeletedByTTL = {
  trigger: 'TTL';
  ttlInSecs: number;
};
// type DeletedByTTLArray = ['TTL', number];
export function TTL(ttlInSecs: number): DeletedByTTL {
  return {
    trigger: 'TTL',
    ttlInSecs,
  };
}

function genDeletionId(modelName: string, modelId: string) {
  return `${modelName}(${modelId})`;
}
export const REASON_ROOT = 'ROOT';

const TTL_60DAYS = 60 * 60 * 24 * 60;
@Model({name: '__DELETED', deletions: [TTL(TTL_60DAYS)]})
export class DELETED extends BaseModel {
  static genId(modelName: string, modelId: string) {
    return genDeletionId(modelName, modelId);
  }
  @Field(TString) modelName: string;
  @Field(TID) modelId: ID;
  @Field(TString) modelVersion?: string;
  @Field(TMap) modelData?: Record<string, any>; // for restoring
  @Field(TArray(TID)) reasons: ID[]; // for debugging and restoring (TBD: store the deletion rule, root model)
  @Field(TString) status:
    | 'INIT'
    | 'STARTED'
    | 'FINISHED'
    | 'FAILED'
    | 'RESTORE_STARTED'
    | 'RESTORE_FAILED' = 'INIT';
  @Field(TString) details?: string;
}

@Model({name: '__TODELETE'})
export class TODELETE extends BaseModel {
  static genId(modelName: string, modelId: string) {
    return genDeletionId(modelName, modelId);
  }
  @Field(TString) modelName: string;
  @Field(TID) modelId: ID;
  @Field(TInt) deleteAt: number;
  @Field(TString) status: 'INIT' | 'STARTED' | 'FINISHED' | 'FAILED' = 'INIT';
  @Field(TString) details?: string;
}
