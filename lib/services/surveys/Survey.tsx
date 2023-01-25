/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {User} from '@toolkit/core/api/User';
import {
  BaseModel,
  DeletedBy,
  Field,
  Model,
  Ref,
  TBool,
  TMap,
  TModel,
  TString,
} from '@toolkit/data/DataStore';

// States for a SurveyImpression
// SEEN: The user was shown the survey prompt, but dismissed it (or let it time out)
// OPENED: The user saw the prompt, tapped "Continue", and saw the survey
// COMPLETED: The user completed the survey
export type SurveyImpressionState = 'SEEN' | 'OPENED' | 'COMPLETED';
type SurveyID = string;

@Model({name: 'survey'})
export class Survey extends BaseModel {
  @Field(TString) url: string;
  @Field(TBool) active: boolean;
}

// The ID of SurveyImpression objects should be the user ID
@Model({name: 'survey_impressions'})
@DeletedBy(Ref('user'))
export class SurveyImpressions extends BaseModel {
  @Field(TModel(User)) user: User;
  @Field(TMap) state: Record<SurveyID, SurveyImpressionState>;
}
