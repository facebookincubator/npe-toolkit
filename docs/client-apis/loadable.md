# Loadable

Pattern for defining React Components that can load their own data

## Motivation

Loadable is a pattern for making async data requests to needed to render for
React Native components, supporting the following goals:

- Components are self-contained
  - They make their own requests for the data that they need to render
- Main component definition can assume all data is available when rendering
  - No conditional code based on data loading state, and no need for repeated
    null checks
  - Don't need to incorporate loading and error state UI — these are configured
    using higher-level components, with standard `<React.Suspense>` and
    `ErrorBoundary` semantics
- Async data is loading is not tied to a specific framework
  - Only requirement is that you create a standard `Promise`
  - Allows using the same utilities and code paths for remote data requests,
    device APIs, and local storage
- Async requests are sent in parallel
  - Hook-based `<React.Suspense>` APIs often have performance issues when making
    more than one request

## Usage

### **Overview**

Loadable components defines a `load()` static method that returns a promise with
the async loaded data, which is then passed into the component’s `Props` under
`async` key

- Usage is type-safe based on the `Props` definition
- To use a self-loading component, wrap with `useAsyncLoad()` /
  `withAsyncLoad()`
  - `withAsyncLoad()` is for statically defined components
  - `useAsyncLoad()` is for hooks with dynamically defined components

Setup

- Loadables rely on `<React.Suspense>` and `ErrorBoundary` semantics for
  handling state for “before loaded”, and “didn’t successfully load”.
  - This means you need a higher level component on the tree for both concerns.
    `TriState` is a wrapper utility that combines both with params to define the
    loading and error UI

.

### **Defining a Loadable component**

in `ComponentThatLoadsData.tsx`

```tsx
`type Props = {
  userId: string;
  async: {
    user: User;
  }
};

const ComponentThatLoadsData: Loadable<Props> = props => {
  return <Text>Hello {props.async.user.name}</Text>
}

ComponentThatLoadsData.load = async props => {
  const user = await someFunctionThatReturnsUser(props.id);
  return {user: user};
}

export default withAsyncLoad(ComponentThatLoadsData);
`;
```

.

### **Using a Loadable component**

```tsx
function CallerComponent() {
  // ...
  return <ComponentThatLoadsData userId="123"/>;
}
`
```
