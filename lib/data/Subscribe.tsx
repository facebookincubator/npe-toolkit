/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {Opt} from '@toolkit/core/util/Types';
import {useDataStore} from '@toolkit/data/DataStore';
import {
  EdgeSelector,
  EntQuery,
  HasId,
  ModelClass,
} from '@toolkit/data/DataStore';

/**
 * Makes a query to the datastore, subscribes to updates, and triggers React state changes
 */
export function useLiveQuery<T extends HasId>(
  entity: ModelClass<T>,
  opts?: {
    query?: EntQuery<T>;
    edges?: EdgeSelector[];
  },
) {
  const dataStore = useDataStore(entity);
  const [data, setData] = React.useState<T[]>([]);

  React.useEffect(() => {
    return dataStore.subscribeGetMany(result => {
      if (result.data) {
        setData(result.data);
      }
    }, opts);
  }, [entity, JSON.stringify(opts)]);

  return data;
}

/**
 * Gets a value by key from the datastore, subscribes to updates, and triggers React state changes
 */
export function useLiveGet<T extends HasId>(
  entity: ModelClass<T>,
  id: string,
  opts?: {
    edges?: EdgeSelector[];
  },
) {
  const dataStore = useDataStore(entity);
  const [data, setData] = React.useState<Opt<T>>(null);

  React.useEffect(() => {
    return dataStore.subscribeGet(
      result => {
        if (result.data) {
          setData(result.data);
        } else {
          setData(undefined);
        }
      },
      id,
      opts,
    );
  }, [entity, id, JSON.stringify(opts)]);

  return data;
}
