# Screens, Layouts, and Nav

Screens, Layouts, and Navigation make it possible to define pages, navigate
between them, and define common application chrome:

- Screens are the main content of a page shown in a client application
- Navigation APIs are a type-safe wrapper around transitioning between Screens
- Layouts define common application chrome and layout that is shared across an
  app. Screens are rendered within a Layout

Screens and Layouts work together. Navigation is an optional convenience API,
but not required when using the other two.

## Motivation

Decoupled abstractions for Screens, Layouts, and Navigation with a simple API to
configure and use.

`react-navigation` provides low-level versions of these abstractions that are
more tightly coupled. We've found it useful and easier to create components with
to have more generic Screen and Layout primitives (see “Features” below for
specific benefits)

## Features

- Can create a screen by defining a standard React Component
  - Standard React `Props` are used to pass in parameters to the screen
- Screens don't depend on Layout or Navigation implementations
  - The same screen can work within multiple Layouts.
  - Easier to create Screens when you are focusing just on the UI being rendered
- Layout and Navigation are independent concepts
  - (in contrast to `react-navigation`, which couples the two concepts in
    `Navigator`s)
  - Flexible way to define common layout / chrome in your app without writing
    code to manage navigation state
  - Smooths over some of the confusing edges in configuring `react-navigation`
    (although full access is given to the underlying primitives if needed)
- Simplifies configuration by defining all metadata associated with a screen
  alongside the screen
  - Just one entry in a central config file to register a new Screen
- Provides simple, type-safe navigation primitives that map directly to the
  Component and its Props
  - No indirection needed - to navigate to `MyScreen`, you call
    `navTo(MyScreen, propsForMyScreen)`
- Supports a pattern for async loading of data needed to render Screens (they
  extend the [Loadable](loadable.md) interface)

## Usage

- The `Screen` is the main content of a page, and you define one per page in the
  app
  - Define all params needed to render the screen as top-level Props (note: this
    is different than React Navigation, with requires getting them from the
    route)
  - Async loading of data is available via the [Loadable](loadable.md)
    interface
- `The Layout` renders the standard app chrome around the `Screen`
  - Generally each app you’ll define a single `Layout` (we’ll have a few
    prebuilt ones)
  - Layouts are expected to handle both loading and error state for the screens
    they display
    - To support this, they should include both a `<React.Suspense>` and an n
      `ErrorBoundary`. `TriState` is utility that conveniently wraps them both
- We have utilities to make it easy to define a set of screens and use with
  React Navigation (see code example below)
  - Under the hood this calls.
    `<ApplyLayout screen={Screen} layout={Layout} params={{...}}/>`, which you
    can call directly for other use cases or if you want to customize
- Navigation has a set of type-safe APIs available from the `useNav()` hook
  - Main one is `navTo(ScreenComponent, propsForScreen)`, but there are options
    for standard navigation operations
  - These primitives handle navigation stack and nesting under the hood, so that
    after transition your navigators should have a consistent set of screens on
    them


**Defining a Screen**

```tsx
import {Screen} from '@npe/lib/screen/Screen';

type Props = {
  userId: string;
  async: {
    user: User;
  };
};

const MyScreen: Screen<Props> = props => {
  return <Text>Hello {props.async.user.name}</Text>;
};

// Parameters used by the app Layout
MyScreen.title = 'My Screen';
MyScreen.style = 'full';

// Async data loading is optional, see Loadable for usage
MyScreen.load = async props => {
  const user = await someFunctionThatReturnsUser(props.id);
  return {user: user};
};

export default MyScreen;
```

**Defining a layout**

```tsx
import {LayoutComponent} from '@npe/lib/screen/Layout';
import TriState from '@npe/lib/util/TriState';
import {useNav} from '@npe/lib/screen/Nav';
import LoginScreen from './MyLoginScreen';

const `MyLayout`: LayoutComponent = (props) => {
  const {title, children, style} = props;
  const {navTo} = useNav();

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err)) {
      navTo(MyLoginScreen)
      return true;
    }
    return false;
  }

  const key = JSON.stringify({ key: route.key, params: route.params });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={style === 'full' ? null : { flex: 1 }}
      >
        {style !== 'full' && <Header/>}
        <TriState key={key} onError={onError}>
         <View style={{ flex: 1 }}>{children}</View>
        </TriState>
      </ScrollView>
    </View>
  );
};
```

**Use library to set up screens as React Nav screens**

_Quirks of how React.Navigation APIs are configured made it not possible to have
more compact notation. This is still significantly less code than setting up
manually_

```tsx
import {
  NavContext,
  useReactNavScreens
} from '@npe/lib/screen/ReactNavScreens';
`import`` ``{``createNativeStackNavigator``}`` ``from`` ``'@react-navigation/native-stack'``;
import {NavigationContainer} from '@react-navigation/native';`

const ROUTES: Routes = {
  MyScreen,
  ...
};
const Stack = createNativeStackNavigator();

function AppComponent() {

  const {navScreens, linkingScreens} = useReactNavScreens(
    ROUTES,
    MyLayout,
    Stack.Screen
  );

  // For deep links
  const linking = {
    prefixes: ['https://myapp.npe.app'],
    config: linkingScreens,
  };

  return (
    <NavigationContainer linking={linking}>
      <NavContext routes={ROUTES} />
      <Stack.Navigator initialRouteName="MyScreen">
          {navScreens}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

```

You can also pass in components that call `<ApplyLayout>` directly to create
screens if you prefer to avoid this layer of abstraction.


**Navigating to a screen**

```tsx
import {useNav} from '@npe/lib/screen/Nav';

function ButtonThatGoesToMyScreen() {
  const {navTo} = useNav();

  function onPress() {
    navTo(MyScreen, {userId: 123}); // This does type checking on the params
  }

  return <Button onPress={onPress} title="Go to MyScreen" />;
}
```

`useNav()` also has

- `replace()` to replace current screen in the stack (after `navTo()`, going
  back goes to the screen you navigated from, while with `replace()` you go back
  to the previous screen)
- `setParams()` to stay on the same screen but change params
- `back()` to go back, and `backOk()` to check if you can go back
- `reset()` to clean all of the back stacks and move directly to a screen
  - Clears out existing back stack, but might push a logical parent page to go
    back to if you are navigating to a leaf page - for example, in an email
    client if you reset to show an email, it might add the inbox view on the
    stack first
