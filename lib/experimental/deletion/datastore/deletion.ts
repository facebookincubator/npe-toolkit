/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {BaseModel, Field, Model, TTL} from '@toolkit/data/pads/model';
import {TArray, TID, TInt, TMap, TString} from '@toolkit/data/pads/schema';
import {ID} from '@toolkit/data/pads/utils';

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
