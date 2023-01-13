# Firebase functions

_Information on setting up and deploying Firebase Functions_

Firebase functions are **not** required for initial prototyping of your app,
however most projects will need a functions deployment fairly early in the
process. Cases where you'll need to deploy functions:

- Business logic that can't be safely executed in client code.
  - For example, to send push notifications you will need to deploy Firebase
    Functions
  - This is the most common requirement that leads to your first function deploy
- Performance of client side data requests
  - Datastore access from the client is handled serially for each "edge hop"
    (e.g. post -> comment -> author). By deploying on the server you can improve
    the peformance of these lookups
- Additional input validation
  - Server-side processing can be used to guarantee invariants when writing data
    (e.g. text < 50 characters). While Firestore rules have the ability to
    enforce many patterns, it is difficult to manage these rules and there are
    invariants that can't be enforced
- Server-side processing can enhance output when reading data

  - For example, getting a temporary hashed CDN URL for an image

## Deploying Functions

Starting from your app directory.

```
cd server/functions
yarn install
yarn firebase use $FIREBASE_PROJECT
yarn firebase deploy --only functions
```

Notes:

- Replace `$FIREBASE_PROJECT` with the name of your Firebase project

## Running Functions locally in emulator mode

Steps to run functions locally

**Download your credentials locally**

- Go to the Firebase console
- Download credentials from
  `Settings icon > Project settings (menu item) > Service accounts (tab) > Generate new private key (button)`
- Save this file in `~/secrets/$PROJECT_NAME.json`, where `$PROJECT_NAME` is the
  name of your project

**Switch app to use emulator mode**

- Go to `common/Firebase.tsx'
- Set `useEmulator: true`

**Call a function**

Initial app install wont' call funcitons. You can write your own, or switch
`getUser` call to use a server-side function:

- Go to `client/app/AuthConfig.tsx`
- Set `CREATE_USERS_ON_SERVER = true`

**Run emulators**

```
cd server/functions
yarn install
sh emulators.sh
```
