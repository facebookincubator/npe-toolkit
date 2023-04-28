# React Native readability guidelines

Make React Native code as easy to read as possible!

The goal of these guidelines is to enable folks reading the code you write to
understand and follow the logic of the code and structure of the React Native
component tree instead of getting lost in the syntax.

None of these are hard rules, and especially while you are iterating on code in
early stages it's OK to not follow the guidelines. Over time though as files
have less velocity, when you edit the files you are encouraged to clean up the
files as you go.

## Avoid multi-line JSX attributes

JSX attributes shouldn’t span multiple lines.

Common use cases and how to clean up:

### Move multi-line styles to a separate declaration

**Before**

```tsx
<Image
  style={{
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -20,
    marginVertical: 0,
  }}
  key={idx}
  source={{uri: u}}
/>
```

**After**

```tsx
<Image style={S.image} key={idx} source={{uri: u}} />

...

const S = StyleSheet.create({
  image: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -20,
    marginVertical: 0,
  },
});
```

---

### Move multi-line functions to a separate declaration

**Before**

```tsx
function MyComponent() {
...
  return (
    <IconTextButton
      style={S.addMoreButton}
      icon="plus-circle-outline"
      onPress={() => {
        if (Platform.OS === 'web') {
          window.alert('Coming soon!');
        } else {
          Alert.alert(
            'Coming soon!',
            'Right now add people one by one. Thanks!',
          );
        }
      }}
      text="Add someone else"
    />
  )
}
```

**After**

```tsx
function MyComponent() {
  function onAddMore() {
    if (Platform.OS === 'web') {
      window.alert('Coming soon!');
    } else {
      Alert.alert('Coming soon!', 'Right now add people one by one. Thanks!');
    }
  }

  return (
    <IconTextButton
      style={S.addMoreButton}
      icon="plus-circle-outline"
      onPress={onAddMore}
      text="Add someone else"
    />
  );
}
```

---

### Don’t use braces for single-line functions

If braces are needed because the return type doesn’t match what is expected,
then move the function to a separate declaration

**Before**

```tsx
function MyComponent() {
...
  return (
    <Button
      icon="bookmark-multiple"
      color={THEME.colors.teamOne}
      onPress={() => {
        setOnboardingVisible(true);
      }}
      text="Learn More"
    />
  )
}
```

**After**

```tsx
function MyComponent() {
...
  return (
    <Button
      icon="bookmark-multiple"
      color={THEME.colors.teamOne}
      onPress={() => setOnboardingVisible(true)}
      text="Learn More"
    />
  )
}
```

---

## Prefer single-line JSX elements

The React component hierarchy is easier to grok when most JSX elements tags are
on a single line. Having one multi-line element in a tree is often OK. But once
there are 2-3+ multi-line elements, it becomes nearly impossible to scan and
understand the structure.

When possible, you should make changes to fit JSX elements on to a single line.
In addition to the changes above to avoid multi-line attributes, here are other
common ways to create single-line JSX elements:

### Use shorter variable names

It may feel like a gimmick, but using shorter variable names can make code
considerably more readable when JSX elements don’t wrap.

**Before**

```tsx
function MyComponent() {
  const [editorState, setEditorState] = React.useState({});
...
  return (
   <PostEditor
      state={editorState}
      onChange={setEditorState}
      focused={focused}
    />
  )
}
```

**After**

```tsx
function MyComponent() {
  const [state, setState] = React.useState({});
...
  return (
     <PostEditor state={state} onChange={setState} focused={focused} />
  )
}
```

---

### Move logic out of attributes if it causes text to wrap

If braces are needed because the return type doesn’t match what is expected,
then move the function to a separate declaration

**Before**

```tsx
function MyComponent() {
...
  return (
   <Icon
      name={props.icon}
      size={25}
      color={props.color ?? THEME.colors.accent}
    />
  )
}
```

**After**

```tsx
function MyComponent() {
...
  const color = props.color ?? THEME.colors.accent;
  return (
    <Icon name={props.icon} size={25} color={color} />
  )
}
```

---

### Destructure into local variables

Both `props` and global variables can be long if fully prefixed. Destructure
these or just create local variables for the JSX attributes.

**Before**

```tsx
function MyComponent() {
...
  return (
    <Icon
      name="format-bold"
      color={THEME.colors.backdrop}
      size={20}
    />
  )
}
```

**After**

```tsx
function MyComponent() {
...
  const {backdrop} = THEME.colors;
  return (
    <Icon name="format-bold" color={backdrop} size={20} />
  )
}
```

---

### Use children to pass main user-visible string to components

Strings can be long, and they are more readable as a child node than as part of
a multi-line JSX tag. To make these changes requires modifying the underlying
component to use the `children` prop instead of a named prop such as `text`.

**Before**

```tsx
function MyComponent() {
...
  return (
   <Button
      icon="plus"
      color={teamTwo}
      onPress={() => showModal()}
      text="Create Post"
    />
  )
}
```

**After**

```tsx
function MyComponent() {
...
  return (
   <Button icon="plus" color={teamTwo} onPress={() => showModal()}>
      Create Post
    </Button>
  )
}
```

---

### Move common component attributes to a shared component

Often times there are repeated styles and attributes that can be pulled out into
a separate component.

Factoring out these common attributes into a separate component can create more
overall lines of code, but in the end can still improve readability.

Note that it’s not important to move shared components to a standalone file, and
if the shared component’s callers are all in a single file it is better to keep
the component in the same file with the callers.

**Before**

```tsx
function MyComponent() {
...
  return (
    <View>
      <Button
        color="black"
        onPress={() => {
          removeComment();
        }}
        style={{backgroundColor: color}}
        uppercase={false}>
        Delete
      </Button>
      <Button
        color="black"
        onPress={() => {
          setIsDeleting(false);
        }}
        style={{backgroundColor: color}}
        uppercase={false}>
        Cancel
      </Button>
    </View>
  )
}
```

**After**

```tsx
function MyComponent() {
...
  return (
    <View>
      <CommentButton onPress={() => removeComment()} bgColor={color}>
        Delete
      </CommentButton>
      <CommentButton onPress={() => setIsDeleting(false)} bgColor={color}>
        Cancel
      </CommentButton>
    </View>
  )
}

...

type CommentButtonProps = {
  bgColor: string;
  onPress: () => void;
  children?: React.ReactNode;
};

const CommentButton = ({bgColor, onPress, children}: CommentButtonProps) => {
  return (
    <Button
      color="black"
      onPress={onPress}
      style={{backgroundColor: bgColor}}
      uppercase={false}>
      {children}
    </Button>
  );
};
```

---

## Make components self-contained

One of the strengths of React Native is that you can create components with
built-in behavior, and components should be self-contained to the extent
possible.

What this means in practice...

### Component props should only pass in functions when needed to generalize

When a component has UI elements that trigger actions or data mutations, the
component should trigger these actions directly instead of passing in a callback
function prop, unless the prop is needed because either (a) the presentation
logic is reused for multiple clients with different actions, or (b) There is
state in the parent component that can’t reasonably managed by the child.

**Before**

```tsx
function MyComponent() {
...
  return (
    <ChooseSide
      onChoose={async side => {
        await joinSide(side);
        setModalVisible(false);
      }}
      visible={modalVisible}
      angles={angles}
      onClose={() => {
        setModalVisible(false);
      }}
    />
  )
}
...
const ChooseAngle = ({visible, onClose, angles, onChoose}: Props) => {
}
```

**After** Logic below, + logic to touch the angle in the database to trigger a
page reload on the parent page instead of using React state.

```tsx
function MyComponent() {
...
  return (
    <ChooseAngle
      visible={modalVisible}
      angles={angles}
      onClose={() => setModalVisible(false)}
    />
}

export const ChooseAngle = ({visible, onClose, sides}: Props) => {
  const joinAngle = useApi(JoinAngle);

  ...
  async function onChoose(side: Side) {
    await joinSide(side);
    onClose();
  }
  ...
}
```

---

### Co-locate component with only caller

Components for parts of screens/pages should be moved to a separate file if
there are multiple callers. If there is a single file with all references to the
component, it’s easier to understand the logic if it stays in the same file.

---

## Other Guidelines

### Use `React.useCallback()` only when needed for performance or correctness

`React.useCallback()` improves performances at the expense of readability. It
also may be needed to ensure that the function is the “same” for equality
checks.

Only use callback if needed for performance or for correctness.

### Don’t use `React.useState()` for derived data

If the value of a variable in a react component can be computed from the value
of other variables, don’t store it a React state variable.

### Avoid `<FlatList>` for short lists

FlatLists are more difficult to define and read, and the performance benefits
are only significant for long lists (>200 items or with complex content).

Prefer using a `<View>` element with children over `<FlatList>` until you reach
the point where performance is important.

### Prefer concise variable names

Long variable names often are redundant and create readability issues when they
cause lines to wrap. Prefer concise variable names, even at the cost of being
explicit about what the variable refers to — the readability of more concise
code blocks often is more important than than the benefit of using a
`reallyExplicitVariableNameWithType`.

### Use double quotes for string attributes

Use `<Component foo="bar">` not `<Component foo={'bar'}`.

### Keep object literals on a single line when possible

If an object literal doesn’t need to wrap, keep it on a single line.

```tsx
const foo = {bar: 123, bat: 'abc'};
```

instead of

```tsx
const foo = {
  bar: 123,
  bat: 'abc',
};
```

### Don’t have JSX elements with open and close tag but not content

Use `<View style={S.container}/>`, not `<View style={S.container}></View>`.

### Use “S” for file-level stylesheet declaration

A common pattern is to have a single stylesheet declaration in every file.

Recommend using `S` as a conventional name of this stylesheet declaration as the
conciseness helps keep the rest of the code readable, and once you are used to
this convention you know it refers to the styles in the file.

### Avoid using ternary logic for JSX elements

Ternary logic for JSX elements is hard to read

```tsx
<View>
  {isExpanded ? (
    <View style={S.expanded}>
      <Text>This section is expanded</Text>
      <SectionContents truncated={false}/>
    </View>
    : (
    <View style={S.normal}>
      <Text>This section isn't expanded</Text>
      <SectionContents truncated={true}/>
    </View>
    )
  }
</View>
// or
<View>
  {isExpanded ? (
    <View style={S.expanded}>
      <Text>This section is expanded</Text>
      <SectionContents truncated={false}/>
    </View>
   )
    : null
  }
</View>
```

Prefer using `test && component` for conditionally showing an element:

```tsx
<View>
  {isExpanded && (
    <View style={S.expanded}>
      <Text>This section is expanded</Text>
      <SectionContents truncated={false} />
    </View>
  )}
</View>
```

And for other cases, assign variables for the conditional JSX content
