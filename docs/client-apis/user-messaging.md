# User Messaging

API to enable code at any layer of the client stack to display a message to the
use, often displayed as transient overlays (but this UI treatment is not a
requirement).

## Motivation

A common use case in client applications is that code needs to display a message
to the user, but has no understanding of the UI and layout, and no direct access
to the components used there. One example is when a request to the server is
sent without a blocking UI indicator for progress — in these cases, when the
request fails (and sometimes when they succeed), you want to trigger a message
on the screen to let the user know this was the case. Because this request
wasn’t blocking, the message could be triggered on any page in the app, and the
lower-level code also doesn’t know or want to know how the app implements the
display of the message.

So the goal is to have a simple API that any code in the stack can call to
display a message to the user.

## Usage

- Uses [AppContext](./app-context.md) API to provide the messaging API to code
  via the `useUserMessagingHook()` at any layer of the stack
- How to call
  - `showMessage(msg: string)` shows an informational message to the user
  - `showError(msg: Error | string)` shows an error state message to the user -
    will show the `msg` param directly if it’s a string, pull the user visible
    message if the Error is a `CodedError`, and otherwise will display a generic
    error message
- Has a very basic messaging UI (`<SimpleUserMessaging>`)to get started, but
  you’ll want to likely implement your own custom UI
- Likely future enhancements
  - Additional / more configurable off-the-shelf messaging UI
  - Ability to add buttons or links into this message

**Show a message / error to the user**

```tsx
function ButtonThatDoesSoemthingAsync() {
  const {showMessage, showError} = useUserMessaging();

  function onPress() {
    try {
      await someServerAction();
      showMessage('Success!');
    } catch (e) {
      showError(e);
    }
  }

  return <Button onPress={onPress} title="Do it!"/>;
}
```

**Configuring messaging**

`<SimpleUserMessaging>` is a basic user messaging component. When you define
your own you can replace it in the example below.

```tsx
function AppComponent() {
  return (
    <AppContextProvider ctx={[]}>
      <MainAppUi />
      <SimpleUserMessaging />
    </AppContextProvider>
  );
}
```

**Creating your own user messaging component**

To create a messaging component, you need to provide a `UserMessagingApi` (with
`showMessage()`, `clear()`, and `showError()`) in AppContext. You’ll generally
define this API inline in a React Component that you can insert near the top
level of your React component tree, and have the component call
`setInitialAppContext(USER_MESSAGING_KEY, userMessagingApi)` to register the
API.

Skeleton of a component for providing this API is below, but easiest way to get
started is to copy the
[\<SimpleUserMessaging\>](https://github.com/facebookincubator/npe-toolkit/blob/6e1620918cac9269ae0031dfb4ec3f65ea84a3c4/lib/core/client/UserMessaging.tsx#L53)
component and then modify for your needs.

```tsx
function MyUserMessaging = () => {
  const [visible, setVisible] = React.useState(false);

  function showError(error: Error | string) {
    setVisible(true);
    ...
  }

  function showMessage(text: string) {
    setVisible(true);
    ...
  }

  function clear() {
    setVisible(false);
    ...
  }

  const api = {showError, showMessage, clear};

  setInitialAppContext(USER_MESSAGING_KEY, api);

  return (
    <>
      {visible && (
        <View>
          ... implementation here
        </View>
      )}
    </>
  );
};
```
