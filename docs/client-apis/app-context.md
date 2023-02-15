# App Context

Context is the ability to get information about the running environment -
current user, app style, Facebook auth configuration, etc. - at any point in the
code with a simple function call, without relying on global singleton state.

App Context is a a set of utilities to make it easier to define and use
client-side context.

## Motivation

React has a built-in context primitive, React Context, that provides a simple
API for providing and consuming client context. However the API has two
important limitations:

- The API depends on React, so code using React Context directly can't be used
  outside of React components
  - We have libraries and that works across React components, background tasks
    on the client, and server-side functions
  - Context is critical for these libraries, so, for example, we can get the
    current user ID for logging
- React Context requires a new top-level React Component for each value added to
  the context
  - This doesn’t scale well and can create extremely verbose app configuration
    functions
  - Additionally, we are using context extensively in the NPE Toolkit, as almost
    all cases of global state are problematic. This means that providing a
    simpler way to configure context. was a more important concern
    - Example of using context instead of global state: To enable developers to
      change the app to point to a staging environment for testing, all backend
      configuration needs to be stored in context and not in global state

## Goals

- Make it very lightweight to provide and consume context (and avoid using
  globals)
- Enable code to be written that can be shared outside of React components - in
  background tasks on the client, and in Node.js code on the server (for
  example, our data layer works in all three environments)
- Enable hosting multiple apps inside the same shell, similar to Expo Go (very
  useful for quick deployment to attach to an existing binary, but this only
  works if apps have siloed config)

For reference, the types of variables that often are defined in App Context:

- Configuration: API Keys, URLs, etc
- Customizations: Styles, service providers for a given API (e.g. a LogProvider)
- Infrequently changing global app state: Current user, locale

## Usage

**Configuring context at top level of app**

```tsx
import {AppContextProvider, provider} from '@npe/lib/util/NPEAppContext';
import {STYLE_KEY} from '../somestylelib/StyleContext';

const STYLE = context(STYLE_KEY, {fontColor: 'orange'});

<AppContextProvider ctx={[STYLE]}>
  ... your app content here, eg
  <MainAppComponent />
</AppContextProvider>;
```

**Configuring context values using a function call**

```tsx
 import {FIREBASE_CONFIG} from '../FirebaseUtils';

 function MainAppComponent() {
   setInitialAppContext(FIREBASE_CONFIG, {apiKey: 'abc', ...});

   return <View>...</View>
 }
```


**Using context**

```tsx
const style = useAppContext(STYLE);
const firebaseConfig = useAppContext(FIREBASE_CONFIG);

doSomethingWith(style, firebaseConfig);
```

A common pattern for context will be to wrap the `useAppContext()` call in a
utility function. So the above might turn into:

```tsx
const style = useStyle();
const firebaseConfig = useFirebaseConfig();

doSomethingWith(style, firebaseConfig);
```
