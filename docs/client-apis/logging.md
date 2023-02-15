# Logging

API for event logging with a pluggable implementation that can be used by code
at any layer of the Client stack.

## Motivation

Code at any layer of the client stack should be able to log events:

- Using a simple API
- With ability to pull information from context (such as the current user) to
  use in logging
- Without depending on any specific backend implementation (e.g. Firebase
  Analytics, www)

## Api Features

- Core API is logging an event with a string ID
  - This API is for discrete events and not generic developer logging, and is
    not an equivalent of System.out
  - No rules about namespacing the strings (yet) - apps can choose own rules to
    avoid duplication
- Log events support recording result of async operations: success state,
  duration, error code (for failures), and a stack trace
  - Coming soon: Ability to attach logging to a Promise
- Log function is obtained by calling a hook during component rendering
  - Hook is used to get context and call any other hooks needed to configure the
    logger
  - Important for log implementations to use context and not global variables
    for contextual logging data - this ensures that race conditions for async
    functions don't occur (for example, if user switches accounts while a
    background task is running)
- Defaults to a no-op logger (but may change to have an internal buffer for
  debugging)
- Has built-in implementations for logging to www, Firebase Analytics and
  `console.log()`
- Supports calling multiple loggers using `MultiLogger`
- Many other primitives (e.g [Actions](./actions.md) have logging automatically
  built in

## Usage

**Logging an event:**

```tsx
function MyComponent() {
  const logEvent = useLogEvent();

  function onPress() {
    // Note: This can also be encapsulated in an action
    logEvent('FOO_BUTTON');
  }

  return (
    <View>
      <Button onPress={onPress}>Foo It!</Button>
    </View>
  );
}
```

**Configuring logging using existing provider:**

```tsx
import {FIREBASE_LOGGER} from '@npe/lib/firebase/FirebaseLogger';

function App() {
  return (
    <AppContextProvider providers={[FIREBASE_LOGGER]}>
      // ... children
    </AppContextProvider>
  );
}
```

**Configuring logging using your own provider**

```tsx
function useMyAppLogger() {
  const user = useCurrentUser();
  return (event: string, payload?: ClientLogParams) => {
    const myLogPayload = {user: user.id, name: event};
    useMyLogger(payload);
  }
};
contst LOGGER = context(LOGGER_CONTEXT_KEY, useMyAppLogger);

function App() {
    return <AppContextProvider providers={[LOGGER]}>
      // ... children
    </AppContextProvider>;
}
```
