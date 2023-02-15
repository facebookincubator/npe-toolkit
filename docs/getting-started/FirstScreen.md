# Creating a Screen

A `Screen` is the content of a page in your application.

Screens are defined using regular React Components and component props, with
ability to define additional screen metadata on using additional fields on the
component.

Let’s jump in and build your first screen!

## **Step 1: Create the Screen component**

Screens are regular React Components, with params passed as Props.

First, create the new screen by creating a new file @
**`client/app/screens/HelloWorld.tsx`** and adding the React component
definition below:

```tsx
import * as React from 'react';
import {Text, View} from 'react-native';

type Props = {
  toGreet?: string;
};

const HelloWorldScreen = (props: Props) => {
  const {toGreet = 'World'} = props;
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{fontSize: 24}}>Hello, {toGreet}!</Text>
    </View>
  );
};

export default HelloWorldScreen;
```

.

Then register the screen in **`App.tsx`** , by adding an entry to the map of
`ROUTES`. All navigation is built from this route map.

```tsx
import HelloWorldScreen from './app/screens/HelloWorldScreen';

const ROUTES: Routes = {
  StartupScreen,
  LoginScreen,
  MyFavesScreen,
  AllThingsScreen,
  SettingsScreen,
  CreateNewThingScreen,
  PhoneInput,
  PhoneVerification,
  WebViewScreen,
  HelloWorldScreen, // <-- ADDED
};
```

.

Finally, add a Button to navigate to the new screen in **`AllThingScreen.tsx`**

```tsx
import {useNav} from '@npe/lib/screen/Nav';
import HelloWorldScreen from './HelloWorldScreen';

function AllThingScreen() {
  const {navTo} = useNav();
  ...

  return (
    <View style={S.container}>
      <Button onPress={() => navTo(HelloWorldScreen)} title="Say Hello" /> // <-- ADDED
      ...
    </View>
  );
}

```

You’ve now created your first screen!

.

## **2. Pass props to the screen**

The Navigation API allows type-safe Props to the screen when navigating, based
on the component definition.

To see how this works, try adding `{notAProp: 'Cruel World'}` as the a second
param to the `navTo()` call :

```tsx

function AllThingScreen() {
  const {navTo} = useNav();
  ...

  return (
    <View style={S.container}>
      <Button
        onPress={() => navTo(HelloWorldScreen, {notAProp: 'Cruel World'})} // <- This line
        title="Say Hello"
      />
      ...
    </View>
  );
}

```

.

You should see a syntax error highlighted. To fix, change the param to
`{toGreet: 'Cruel World'}`:

```tsx
function AllThingScreen() {
  const {navTo} = useNav();
  ...

  return (
    <View style={S.container}>
      <Button
        onPress={() => navTo(HelloWorldScreen, {toGreet: 'Cruel World'})}
        title="Say Hello"
      />
      ...
    </View>
  );
}

```

After this, you can navigate using the `Button` to see the props in action.

.

## 3. Add a title

You may have noticed a blank bar at the top of the `HelloWorldScreen` when
viewing - this is because we haven’t set the title yet.

A goal of `Screens` is to keep all metadata about the screen in the same file
with the React component, to avoid needing to update multiple configuration
fields central file every time you add a new page in your app.

To set the title (and other metadata) you’ll add properties to the component,
and the `Screen` type is an extension of React Component type that provides type
safety for these additional fields.

Modify **`HelloWorldScreen.tsx`** to the following and do a full JS reload to
see how this works.

```tsx
import * as React from 'react';
import {Text, View} from 'react-native';
import {Screen} from '@npe/lib/screen/Screen';

type Props = {
  toGreet?: string;
};

const HelloWorldScreen: Screen<Props> = props => {
  const {toGreet = 'World'} = props;
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{fontSize: 24}}>Hello, {toGreet}!</Text>
    </View>
  );
};
HelloWorldScreen.title = 'Yo Dude'; // <-- ADDED

export default HelloWorldScreen;
```

.

## How it all fits together

[Screens, Layouts, and Navigation](../client-apis/screens-layouts-nav.md) make
it possible to define pages, navigate between them, and define common
application chrome:

- Screens are the main content of a page shown in a client application
- Navigation APIs are a type-safe wrapper around transitioning between Screens
- Layouts define common application chrome and layout that is shared across an
  app. Screens are rendered within a Layout

More details on the [Wiki](../client-apis/screens-layouts-nav.md) about these
concepts, how they are used, and why we have a layer on top of react-navigation
libraries We’ll also go in more depth into how to load data for `Screen`s, and
how to use `Layout`s to change the look and feel of your app in the (soon to be
written) following getting started guides.
