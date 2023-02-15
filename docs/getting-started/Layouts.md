# Using Layouts

`Layout` is used to render common UI elements across different pages in your
application - the back button, title, common icon buttons and links, tabs for
tab navigation, slide out drawers for drawer navigation, etc.

We’ve found it easiest for you to configure and customize rendering of the app
if we make Layout a pluggable component, independent of how your navigation
stack is set up and which React navigation libraries you are using.

You’ll see in your top-level `/app` directory an **`AppLayout.tsx`** file that
has a basic tab-based navigation UI, and you have your own copy...

Let’s make a few changes to the initial layout to show how this all works.

## 1. Add a new Tab

The app comes with a default tab-based navigator that is configured with a JSON
object that lists the top-level screens.

First, we’ll add a new tab. Go to **`App.tsx`** , and add the following to
`TABS` variable.

```tsx
const TABS: NavItem[] = [
  {
    icon: 'hand-right-outline',  // Icon in Ionicons to use for tab
    title: 'Hello!',             // Title of the tab
    screen: HelloWorldScreen,    // Screen to render
    route: 'HelloWorldScreen',   // Route name of screen (legacy, this will be removed in future)
  },
  ..., // Existing items
];


```

This JSON object lists out the tabs in the navigator and renders them at the
bottom.

## 2. Change the UI of the layout

Now go to **`AppLayout.tsx`** and have some fun changing the UI of the screen.

Try changing the styles defined in `S` const at the bottom of the file. You can
change anything you want, but here are a couple of ideas...

Change the title

```tsx
title: {
  fontSize: 32,          // This is larger
  fontWeight: '600',
  paddingHorizontal: 8,
  color: 'purple'        // It wasn't purple before
},

```

Change the tab navigation section

```tsx
tabs: {
  backgroundColor: '#80FF80',
  flexDirection: 'column',
  alignItems: 'center',
}
```

.

You can also change the component rendering tree... . For example, if you want
to add another icon in the header (new items in **bold**):

```tsx
import { Alert } from 'react-native';

...
  // After this line: <View style={{flexGrow: 1}} />
  <View style={S.header}>
    <View style={S.headerActions}>
      {showBack && (
        <IconButton name="chevron-back-outline" size={28} onPress={back} />
       )}
      <View style={{flexGrow: 1}} />
      <IconButton  // <- ADDED
        name="bulb-outline"
        size={28}
        style={S.headerRight}
        onPress={() => Alert.alert('I love it when a plan comes together')}
      />
    ...
    </View>
  </View>

```

The `Layout` gives you full creative control over how your screens are rendered.

## 3. Changing the layout using screen style

There are two ways to change layout based on the current screen in the app.

The first is to use `Screen` styles. Screens can set the following style params
that are made available to the Layout code automatically for rendering
decisions. We’ll go into more details on the style param below, but first let’s
try some examples.

Prereqs:

- Undo changes to `NAV_ITEMS` in step #1 above.
- Make sure you have the `Button` linking to `HelloWorldScreen` from the
  “Creating a Screen” step. If you don’t, add the following snippet in one of
  the files:

```tsx
<Button onPress={() => navTo(HelloWorldScreen)} title="Say Hello" />
```

OK - first we’ll create a modal screen. Add the following to
`**HelloWorldScreen.tsx**`, reload the JS, and click on the button to open

```tsx
HelloWorldScreen.style = {type: 'modal'};
```

Now change the style the following and reload the JS and click on the button
again

```tsx
HelloWorldScreen.style = {nav: 'none'};
```

If this worked correctly, you’ll be stuck on a screen with no navigation
elements ... when you use nav: `none`, it’s your responsibility to provide
navigation controls. For fun, try adding a back button on the screen that lets
you return.

### **More details on screen styles**

Semantics for screen styles can be app-dependent, but here are the fields in
style and standard usage

- Nav Style: How to render common navigation chrome
  - `Screen.style = {nav: 'full' | 'none' | 'simple' | 'back'}`
    - full = full navigation options (title, header, buttons)
      - _Note: This won’t show the tab bar at bottom - that is controlled by
        Screen Type_
    - none = no navigation options
    - back = back button only, no other navigation chrome
    - simple = whatever you want (not currently used)
- Screen Type: Where the page fits into the navigation structure
  - `Screen.style = {type: 'top' | 'std' | 'modal'}`
  - top = shown in top-level navigation views (either tab nav or in drawer
    menus)
    - Top items are the roots of navigation stacks, and generally won’t show a
      “back” button (although back will still work in web-based apps)
    - Items in top level of tab navigation are automatically set to type=‘top’
      during initialization
  - modal = modal presentation
    - Modal items are generally shown in some form of animated overlay, and only
      have option to go back to the previous page
  - std = everything else
    - Standard pages are navigated to from other pages, and will generally have
      a back button and also may link to other standard pages
    - Deep linking to a standard page should put a “top” page before it in the
      stack, so the back button will work. [This isn’t hooked up yet but feel
      free to add it!]

## 4. Changing the layout arbitrarily

As apps grow, it is a common that the layout needs to use custom logic to decide
what to show. For example—maybe on a profile page you don’t want to show the
Settings icon.

We haven’t found common patterns for this type of logic (or at least not yet),
and instead of trying to create layout components that are generic instead
assume that you will be encoding app-specific logic in your Layout (and that’s
OK).. This is why we make a copy of the `AppLayout.tsx` file when creating an
app - you can and should modify it with logic specific to your use cases.

We’ll make a contrived example here to show how this works - were going to
remove the Settings icon on the AllThingsScreen. Go to `**AppLayout.tsx**` and
modify the visible() function in the Header component to the following:

```tsx
function visible(item: NavItem) {
  return item.route !== route.name && route.name !== 'AllThingsScreen'; // This line is added
}
```

After reloading, the settings icon should go away.

The takeaway here is that you can and should modify Layout logic based on the
current route or any other logic that makes sense.
