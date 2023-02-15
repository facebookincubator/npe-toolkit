NOTE: This is a WIP and information will be updated as we iterate.

## Create, Read/Query, Update, Delete

Datastore API provides the following interfaces for reading and writing data.

```tsx
export type DataStore<T extends HasId> = {
  get: (id: string, opts?: {edges?: EdgeSelector[]}) => Promise<Opt<T>>;
  getAll: (opts?: {edges?: EdgeSelector[]}) => Promise<T[]>;
  getMany: (opts?: {query?: EntQuery; edges?: EdgeSelector[]}) => Promise<T[]>;
  create: (value: Updater<T>) => Promise<T>;
  update: (value: Updater<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
};
```

First, get a Firebase Datastore instance for the Entity to make an API call.

```tsx
import {useDataStore} from '@npe/lib/data/DataStoreProvider';

const userStore = await useDataStore(USER);

const user = await userStore.get(userId);
await userStore.update({name: 'Jane'});
await userStore.delete(userId);
```

## Edge Loading

With each read API (`get*()`), you can traverse and load connected edges. Pass
in a list of connected Entities to fetch in a `get*()` call. e.g.

```js
const prefWithUser = await useDataStore(PREFERENCES).get(prefId, {
  edges: [USER],
});
```
