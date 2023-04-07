/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {useReload, useReloadState} from '@toolkit/core/client/Reload';
import Promised from '@toolkit/core/util/Promised';

/**
 * Pattern for React Components that load their own data
 * - Props have an async key for data that is loaded async, and
 * - Have a load() static method that returns a promise to the async props
 * - Use withAsyncLoad(Loadable) to create a wrapper component that self-loads
 *
 * Example:
 * function Foo(props: {id: string, async: {user: User}}) {
 *   return <Text>Hello {props.async.user.name}</Text>
 * }
 * Foo.load = async (props: {id: string}) => {
 *   const user = await someFunctionThatReturnsUser();
 *   return {user: user};
 * }
 *
 * const FooWithLoad = withAsyncLoad(Foo);
 * ... in react; <FooWithLoad id="123"/>
 */

export interface MayLoad<Props> {
  load?: AsyncResolver<Props>;
}

// Interface for a loadable component
export type Loadable<Props extends HasAsync> = React.ComponentType<Props> &
  MayLoad<Props>;

// Interface for having async props
export interface MayHaveAsync {
  async?: AnyProps;
}

export type PropsFor<S extends React.ElementType> = Omit<
  React.ComponentProps<S>,
  'async'
> & {reload?: boolean};

// Internal only types for now (OK if we need to export in future)
type AnyProps = Record<string, any>;
export type HasAsync = {async: AnyProps; [key: string]: any};
export type Async<Props extends MayHaveAsync> = Props['async'];
export type Sync<Props> = Omit<Props, 'async'>;
export type WithAsync<Props, AsyncProps> = {async?: AsyncProps} & Props;
type WithPromise<Props extends HasAsync> = {
  promise: {current: Promised<AnyProps>};
  [key: string]: any;
} & Sync<Props>;
/* @ts-ignore */
type AsyncResolver<Props> = (props: Sync<Props>) => Promise<Async<Props>>;

/**
 * Need four components to manage state for async operations
 * ```
 * 1. <ComponentThatHoldsPromise>
 * 2.   <LoadWrapper>
 * 3.   <ComponentThatThrows>
 * 4.    <RealComponent/>
 *      </ComponentThatHoldsPromise>
 *    </ComponentWithPromise>
 *```
 * The components and why each is needed
 * 1. `ComponentThatHoldsPromise`
 *    State isn't preserved when you throw in React components, so you
 *    need a top level component that holds a ref to the actual promise.
 * 2. `LoadWrapper`
 *    load() functions may use React hooks, and you need to
 *    call the same hooks in the same order for every component load.
 *    However, since we only call load() on initial render, when explicitly
 *    reloading the component, or when props change, the call needs to be
 *    in a separate component
 * 3. `ComponentThatThrows`
 *    Need a component that tries to resolve the promise, throws if
 *    not resolved (for React.Suspense semantics), and calles the
 *    real component with resolved data from the promise.
 * 4. `RealComponent`
 *    Of course you need to call the actual underlying component!
 *
 * `withAsyncLoad()` creates #1 from #4
 *
 * This needs to be called in the global scope. If calling from within
 * another component, use `useAsyncLoad()`
 */

// The results of this function must be cached, either using React.Memo
// or in a constant
export function withAsyncLoad<Props extends HasAsync>(
  component: Loadable<Props>,
): React.ComponentType<Sync<Props>> {
  return (props: Sync<Props>) => {
    if (!component.load) {
      throw new Error('Loadable components must have load() method');
    }
    const reloadState = useReloadState();
    const promiseRef = React.useRef<Promised<AnyProps>>();
    const lastReloadState = React.useRef(reloadState);
    const propsKey = normalizedProps(props);
    const loadedPropsKey = React.useRef(propsKey);

    let shouldSetPromise = false;

    // Load component data the first time as well as if we are re-rendered due to explcit reload
    if (
      promiseRef.current == null ||
      lastReloadState.current !== reloadState ||
      (loadedPropsKey.current != propsKey && reloadOnPropsChange)
    ) {
      lastReloadState.current = reloadState;
      loadedPropsKey.current = propsKey;
      shouldSetPromise = true;
    }
    const ComponentThatThrows = useThrowableWrapper(component);

    return (
      <>
        {shouldSetPromise && (
          <LoadWrapper
            promise={promiseRef}
            component={component}
            componentProps={props}
          />
        )}
        {/** @ts-ignore */}
        <ComponentThatThrows {...props} promise={promiseRef} />
      </>
    );
  };
}

const IGNORED_KEYS = ['navigation', 'route'];
let reloadOnPropsChange: boolean = true;

/**
 * Override to fall back to legacy behavior if apps
 * were relying on components not reloading on props cahnges.
 */
export function setReloadOnPropsChange(reload: boolean) {
  reloadOnPropsChange = reload;
}

/**
 * Convert props to a normalized string key that can be used
 * to determine if two sets of props are the "same" by a string comparision.
 *
 * Sorts keys, and removes keys added by React Navigation
 */
function normalizedProps(props: Record<string, any>): string {
  const sortedKeys = Object.keys(props)
    .sort()
    .filter(key => IGNORED_KEYS.indexOf(key) === -1);
  return JSON.stringify(props, sortedKeys);
}

/**
 * Memoized version of withAsyncLoad().
 *
 * Use this for all cases of creating a HOC from a component dynamically
 * within another component.
 *
 * (important to not recreate new component instances each time)
 */
export function useAsyncLoad<Props extends HasAsync>(
  component: Loadable<Props>,
): React.ComponentType<Sync<Props>> {
  if (component.load) {
    return React.useMemo(() => withAsyncLoad(component), [component]);
  } else {
    // @ts-ignore We do this so that same # of hooks are called each render
    return React.useMemo(() => component, [component]);
  }
}

type LoadWrapperProps = {
  promise: {current?: Promised<AnyProps>};
  component: Loadable<any>;
  componentProps: AnyProps;
};

function LoadWrapper(props: LoadWrapperProps) {
  const {promise, component, componentProps} = props;

  if (!component.load) {
    return <></>;
  }

  promise.current = new Promised(component.load(componentProps));
  return <></>;
}

/**
 * Create a HOC (higher order component) that:
 * - Takes in the original component props + additional "promise" prop
 *   of type Promised
 * - Calls getValue() on the Promised, which triggers React.Suspense
 *   semantics if the promise is not fulfilled, and throws error if
 *   the promise is fulfilled and has an error
 * - Checks if promise error is another promise, and throws an error in this case.
 *   This can occur if a component triggers React.Suspense during component
 *   load - because of hooks rules we are currently not allowing this.
 *   (and specifically auth intialization must be complete before calling
 *   any component that uses `use/RequireLoggedInUser()` during load
 * @param Component
 * @returns
 */
function componentThatThrows<Props extends HasAsync>(
  Component: React.ComponentType<Props>,
): React.ComponentType<WithPromise<Props>> {
  return (props: WithPromise<Props>) => {
    const {promise, ...realProps} = props;

    reloadIfWrappedSuspense(promise);

    // Get the value. This will throw if the load() promise hasn't completed
    const result = promise.current.getValue();

    // Continue on if all promises have been fulfilled
    // @ts-ignore
    return <Component {...realProps} async={result} />;
  };
}

/**
 * Memoize componentThatThrows() to return the same HOC class each time.
 */
function useThrowableWrapper<Props extends HasAsync>(
  Component: React.ComponentType<Props>,
) {
  return React.useMemo(() => {
    const hoc = componentThatThrows(Component);
    hoc.displayName = getDisplayName(Component);
    return hoc;
  }, [Component]);
}

function getDisplayName(Component: React.ComponentType<any>) {
  return Component.displayName || Component.name || 'Component';
}

/**
 * Check if a promised has completed with an error that is also a Promise.
 *
 * This shouldn't occur under normal circumstances, but reloading
 * after the promise completes is safe fallback behavior and
 * avoids errors when hor reloading.
 */
function reloadIfWrappedSuspense(promise: {current: Promised<any>}) {
  const reload = useReload();
  const err = promise.current.getError();

  if (err?.then != null) {
    if (__DEV__) {
      console.log(
        'Potentially dangerous triggering of React.Suspense from Component.load() method. ' +
          "If this wasn't a result a hot reload, defer rendering this screen until " +
          "after auth system is initialized and don't trigger React.Suspense.",
      );
    }

    err.then(reload);
  }
}
