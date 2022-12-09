/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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
} from '@toolkit/data/DataStore';

// These are the fields that will be copied from the user type
// to the profile type that is visible to other users
export const PROFILE_FIELDS = ['pic', 'name'];

@Model({name: 'things'})
@DeletedBy(Ref('creator'))
export class Thing extends BaseModel {
  @Field() name: string;
  @Field() description: string;
  @Field() imageUrl: string;
  @Field() creator: User;
}

@Model({name: 'faves'})
@DeletedBy(Ref('user'), Ref('thing'))
export class Fave extends BaseModel {
  @Field() user: User;
  @Field() thing: Thing;
}
