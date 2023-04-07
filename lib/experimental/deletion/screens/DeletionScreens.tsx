/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import DeletedScreen from './Deleted';
import ToDeleteScreen from './Deletion';
import DeletionDryrunScreen from './DeletionDryRun';
import EditDeletedScreen from './EditDeleted';
import EditToDeleteScreen from './EditToDelete';

// Standard routes for
export const DELETION_ROUTES = {
  deleted: DeletedScreen,
  edit_deleted: EditDeletedScreen,
  todelete: ToDeleteScreen,
  edit_todelete: EditToDeleteScreen,
  deletion_dryrun: DeletionDryrunScreen,
};

export const TOP_LEVEL_DELETION_SCREENS = [
  DeletedScreen,
  ToDeleteScreen,
  DeletionDryrunScreen,
];
