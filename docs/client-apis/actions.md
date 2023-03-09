# Actions

Actions are operations called as result of user actions (e.g. button click), or
a system action (background task execution), defined as a function that
implements the operation & metadata about the operation.

## Motivation

- Support for cross-cutting behavior across different types of user triggered or
  system triggered operations
  - Examples: Logging; triggering user-visible messages on failed async
    operations
- Cleaner encapsulation—can define operations that use React Context outside of
  a React component.
  - Callbacks for UI components (`onPress`, etc) have to be inline in a React
    Component in order to access context or variables derived from context,
    leading to a programming style that has multiple inline functions within
    components with callbacks
  - Cross-cutting functionality frequently needs this context, so a trend in
    maturing apps is towards every function being defined inline which gets
    cluttered
- Decouples operations from specific UI surfaces
  - Can build an Action that is easy to add to a menu, render as a button (with
    text or just an icon), or use on a settings page
  - Beneficial for reuse and for separation of presentation from functionality

_Often you don't need an `Action` and just writing a simple function will meet
your needs - only use Actions if you'd like to take advantage of the features
above._

## Usage

- `Action`s are defined with a handler function (either sync or async) that
  performs the action, and metadata about the `Action`
  - Metadata for Actions includes string ID (for logging and debugging), label,
    and optional icon
- To enable using context (or any other hooks), Actions can be defined by
  providing a function that returns the handler and metadata.
  - Function must be executed as if it were a hook itself if you are using the
    action within a component, and all React hooks must be executed
    synchronously in the same order every call
  - For definitional clarity, the handler + metadata combination is referred to
    as an `ActionSpec`, and an `Action` is either an `ActionSpec` or a function
    that returns an `ActionSpec`
- All metadata needs to be available synchronously... cannot make async requests
  to define the label, icon, etc.
  - If metadata is needed async, you can define an Action inline in a parent
    component that loads the data asynchronously

**Defining an Action**

```tsx
const GO_BACK_ACTION = () => {
  const nav = useNav();

  return {
    id: 'GO_BACK',
    icon: 'chevron-left',
    label: 'go back',
    act: () => nav.back(),
  };
};
```

### **Using an Action**

Most usage of actions will be encapsulated in components that are bound to an
action. Here’s an example of a button that triggers an `Action` when pressed.

You can also use the `useAction()` API directly.

```tsx
function ActionButton(props: {action: Action}) {
  const {id, icon, label, act} = useAction(action);
  return <Button icon={icon} onPress={() => act()}>{label}</Button>;
}

// In some other component...
return <ActionButton action={GO_BACK_ACTION}/>

```

Note that the `act()` function returned from `useAction()` is a wrapper and not
just the handler function - this supports cross-cutting functionality such as
logging actions.

## Dependencies

- **Logging Service API (can be a no-op impl):** Actions and will automatically
  log every action executed to the logging service.
- **Icon Definitions:** To enable defining icons with a string, there needs to
  be a mapping elsewhere of string -> vector icon.
  - Initial library will support Material Community Icons
  - Will be straightforward to add support for a large set of icons using
    react-native-vector-icons
  - This is not an ideal dependency, but the net win for encapsulation seems to
    offset the cost of tying actions to a particular string -> icon definition

Additionally, Actions naturally lead to higher-level components tied to specific
UI libraries that provide buttons, top bars, tabs, etc.. These components are
straightforward to create but need to be written separately for each UI library.
