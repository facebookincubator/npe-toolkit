# Firebase functions

_Information on setting up and deploying Firebase Functions_

Firebase functions are **not** required for initial prototyping of your app,
however most projects will need a functions deployment fairly early in the
process. Cases where you'll need to deploy functions:

- Business logic that can't be safely executed in client code.
  - For example, to send push notifications you will need to deploy Firebase
    Functions
  - This is the most common requirement that leads to your first function deploy
- To run the admin panel
  - Admin panel authorization falls into the category of "unsafe for client
    code"
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

## How to deploy

Starting from your app directory:

```
cd server/functions
yarn firebase use $FIREBASE_PROJECT_ID
yarn firebase deploy --only functions
```

Notes:

- Replace `$FIREBASE_PROJECT_ID` with the ID of your Firebase project

### Testing your deployment

To test that functions have successfully deployed, you can write your own
Function, or switch the call to `getUser` to use a server-side function:

- Go to `client/app/AuthConfig.tsx`
- Set `CREATE_USERS_ON_SERVER = true`

After making this change, when logging in or opening the app after login, a
function request will be made to the server. You can verify this request was
made either by:

- On web, viewing the request in the Network tab in Chrome Developer Tools,
  **or**
- Going to the Functions tab in the Firebase console, and viewing request count
  or logs

## How to run Functions locally (in emulator mode)

**Download your Firebase credentials**

- Go to the Firebase console
- Download credentials from
  `Settings icon > Project settings (menu item) > Service accounts (tab) > Generate new private key (button)`
- Save this file in `~/secrets/$PROJECT_NAME.json`, where `$PROJECT_NAME` is the
  name of your project

**Switch app to use emulator mode**

- Go to `common/Firebase.tsx'
- Set `useEmulator: true`

**Run emulators**

```
cd server/functions
yarn install
sh emulators.sh
```
