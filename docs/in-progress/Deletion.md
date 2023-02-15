# Deletion

Experimental for automated cascading deletion of entities.

TODO: Add more details here

### Enable Deletion on Firebase Firestore

1. Visit and enable
   [Cloud Tasks API (cloudtasks.googleapis.com)](https://console.cloud.google.com/marketplace/details/google/cloudtasks.googleapis.com).
   Reach out to Cloud Foundation if you do not have permission to enable it.

2. Upgrade Firebase CLI to v10 or higher (https://firebase.google.com/docs/cli)

3. In `{YOUR_PROJECT}/server/functions/`, create `deletion.ts` and add:

```tsx
export * from '@npe/lib/firebase/server/FirebaseServerDeletion';
```

And in `index.ts`:

```tsx
// After this line
exports.{YOUR_PROJECT} = require('./handlers');
// Add
exports.{YOUR_PROJECT}.deletion = require('./deletion');;
```

4. The TTL cron job to scan expired objects runs every hour by default. To
   change the frequency, find `initFirebaseServer` and add/update
   `deletionConfig.ttlCronSchedule`. e.g.,

```tsx
initFirebaseServer({
  ...
  deletionConfig: {
    ttlCronSchedule: 'every 10 minutes',
  },
});
```

`ttlCronSchedule` supports both Unix Contab and
[App Engine cron.yaml](https://cloud.google.com/appengine/docs/standard/python/config/cronref)
syntax.

5. Deploy the deletion handlers and worker.

```tsx
$ firebase deploy --only functions:{YOUR_PROJECT}.deletion
```

If you get a prompt like below, enter `y`

```tsx
⚠  functions: The following functions will newly be retried in case of failure: deletion-runOnDocCreate(us-central1), deletion-runOnDocDelete(us-central1). Retried executions are billed as any other execution, and functions are retried repeatedly until they either successfully execute or the maximum retry period has elapsed, which can be up to 7 days. For safety, you might want to ensure that your functions are idempotent; see https://firebase.google.com/docs/functions/retries to learn more.
? Would you like to proceed with deployment? (y/N) y
```

The Toolkit provides Deletion Admin Screens you can drop into your admin app.
You can

- Browse deleted objects in Trashbin
  - Delete permanently
  - Restore
- Browse objects with TTL
  - Change expiration time
- Dryrun delete/restore to see what other objects get deleted/restored by
  deletion rules

To set up,

1. Add Deletion Firebase Functions

- If your app is on the shared Firebase project, create
  `{your_project}/server/functions/deletion.ts` with

```tsx
export * from '@npe/lib/firebase/server/FirebaseServerDeletion';
```

and add in `server/functions/index.ts`

````tsx
exports.{your_project}.deletion = require('./deletion');
```tsx
- For standalones app with own Firebase project, add in `server/functions/index.ts`
```tsx
export * as deletion from '@npe/lib/firebase/server/FirebaseServerDeletion';
```tsx

2. deploy deletion Firebase Functions

3. Add the following `Screens` to your Admin app:
  - `@npe/lib/admin/DeletedScreen.tsx`
  - `@npe/lib/admin/EditDeletedScreen.tsx`
  - `@npe/lib/admin/ToDeleteScreen.tsx`
  - `@npe/lib/admin/EditToDeleteScreen.tsx`
  - `@npe/lib/admin/DeletionDryrunScreen.tsx`
````
