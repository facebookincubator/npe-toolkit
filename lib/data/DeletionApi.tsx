/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import type {DeletionGraph} from '@npe/pads/src/deletion.graph';
import type {JobData} from '@npe/pads/src/deletion.workflow';
import {createApiKey} from '@toolkit/core/api/DataApi';
import {BaseModel} from '@toolkit/data/DataStore';

export const API_DELETION_GET_GRAPH = createApiKey<void, DeletionGraph>(
  'deletion-getGraph',
);

export const API_DELETION_RUN_JOB = createApiKey<JobData, unknown>(
  'deletion-runJob',
);

export const API_DELETION_DRYRUN_DELETION = createApiKey<
  {modelName: string; modelId: string},
  BaseModel[]
>('deletion-dryrunDeletion');

export const API_DELETION_DRYRUN_RESTORATION = createApiKey<
  {modelName: string; modelId: string},
  BaseModel[]
>('deletion-dryrunRestoration');
