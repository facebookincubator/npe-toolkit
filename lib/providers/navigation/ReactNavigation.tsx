/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Platform} from 'react-native';
import {
  CommonActions,
  NavigationProp,
  PathConfigMap,
  useRoute,
} from '@react-navigation/core';
import {
  NavigationState,
  StackActions,
  useNavigation,
} from '@react-navigation/native';
import {eventFromCamelCase, useLogEvent} from '@toolkit/core/api/Log';
import {setInitialAppContext} from '@toolkit/core/util/AppContext';
import {PropsFor} from '@toolkit/core/util/Loadable';
import {Opt} from '@toolkit/core/util/Types';
import {ApplyLayout, LayoutComponent} from '@toolkit/ui/screen/Layout';
import {NAV_CONTEXT_KEY, NAV_STATE_KEY, Routes} from '@toolkit/ui/screen/Nav';
import {Screen, ScreenType} from '@toolkit/ui/screen/Screen';

/**
 * Utiltiy for logging all page transitiions in react-navigation.
 *
 * Usage:
 * ```
 * const navLogger = useReactNavigationLogger();
 * ...
 * <NavigationContainer onStateChange={navLogger}>
 *   ...
 * </NavigationContainer>
 */
export function useReactNavigationLogger() {
  const lastRoute = React.useRef<string | undefined>();
  const logEvent = useLogEvent();

  function onNavStateChange(state: NavigationState | undefined) {
    const route = state?.routes[state?.index ?? 0]?.name;
    if (route !== lastRoute.current) {
      lastRoute.current = route;
      if (route != null) {
        logEvent('VIEW_' + eventFromCamelCase(route));
      }
    }
  }

  return onNavStateChange;
}

const DEFAULT_SCREEN_OPTIONS = {
  modal: {presentation: Platform.OS === 'web' ? 'transparentModal' : 'modal'},
  top: {animationEnabled: false},
  std: {},
};

/**
 * Creates React elements and linking config to use screens with `react-navigation`.
 *
 * Usage:
 *
 *  ```
 * const ROUTES = {
 *   FooScreen,
 *   BarScreen
 * }
 *
 * const {Navigator, Screen} = createStackNavigator(); // Or any navigator type!
 * const {navScreens, linkingScreens} = useReactNavScreens(ROUTES, MyLayout, Screen);
 *
 * const linking = {
 *   prefixes: ['https://semidelectable.web.app'],
 *   screens: linkingScreens
 * }
 *
 * <NavigationContainer linking={linking} {...your params}>
 *   <NavContext routes={ROUTES}/>
 *   <Navigator {...other params}>
 *     {navScreens}
 *   </Navigator>
 * </NavigationContainer>
 * ```
 *
 * Can also pass in `screenOptions` param, which is a mapmap of `ScreenType`
 * (currently `top`, `std`, or `modal`, defined on the Screen)
 * to a set of options passed into the React Navigation screen initializer.
 */
export function useReactNavScreens(
  routes: Routes,
  Layout: LayoutComponent,
  ScreenComponent: React.FC<any>,
  screenOptions: Record<ScreenType, any> = DEFAULT_SCREEN_OPTIONS,
): {
  navScreens: React.ReactNode;
  linkingScreens: any;
} {
  const linkingScreens = linkingFromRoutes(routes);

  function layout(Component: Screen<any>) {
    // TODO: memoize
    return (props: any) => {
      const route = useRoute();
      const allProps = {...props, ...route.params};
      return (
        <ApplyLayout screen={Component} layout={Layout} params={allProps} />
      );
    };
  }

  const navScreens = React.useMemo(
    () => (
      <>
        {Object.keys(routes).map(key => {
          const screen = routes[key];
          const screenType = screen?.style?.type || 'std';
          const options = {...screenOptions[screenType], title: screen.title};

          return (
            <ScreenComponent
              key={key}
              name={key}
              component={layout(routes[key])}
              options={options}
            />
          );
        })}
      </>
    ),
    [routes],
  );

  return {navScreens, linkingScreens};
}

function parseJsonParam(value: Opt<string>) {
  return value ? JSON.parse(value) : null;
}

function serializeJsonParam(value: Opt<{}>) {
  return value ? JSON.stringify(value) : '';
}

function shouldDeepLink(screen: Screen<any>) {
  // Dont deep link to modals, as they need to be displayed on top of an underlying screen
  // in future we might be able to deep link using the screen.parent param, but it's
  // not clear that we want to eanble deep liks to modals.
  return screen.style?.type !== 'modal';
}

function linkingFromRoutes(routes: Routes): PathConfigMap<any> {
  const screens: {[key: string]: any} = {};

  // "nextParams" is special key that is always JSON for redirect purposes
  // TODO: Make this configurable at the screen level - params that aren't strings
  // currently aren't passed in correctly for deep linking purposes
  for (const key in routes) {
    const screen = routes[key];
    if (shouldDeepLink(routes[key])) {
      screens[key] = {
        path: key,
        parse: {nextParams: parseJsonParam},
        stringify: {nextParams: serializeJsonParam},
      };
    }
  }

  return {screens};
}

export function routeKey(
  screen: Opt<Screen<any>>,
  routes: Routes,
): Opt<string> {
  for (const key in routes) {
    if (routes[key] === screen) {
      return key;
    }
  }
  // In DEV mode match on function name as a backup as component instances can change
  // on hot reload. Can't be used in production as it will incorrectly match different
  // components with the same function name
  if (__DEV__ && screen?.name) {
    for (const key in routes) {
      const componentName = routes[key].name;
      if (componentName !== null && componentName === screen?.name) {
        return key;
      }
    }
  }
  return null;
}

function requireRouteKey(screen: Screen<any>, routes: Routes): string {
  const key = routeKey(screen, routes);
  if (key == null) {
    throw Error(`No route defined for ${screen}`);
  }
  return key;
}

export function NavContext(props: {routes: Routes}) {
  useSetReactNavContext(props.routes);
  return <></>;
}

/**
 * Modify "special" params for passing to react nav.
 * Currently only use case is changing "reload: true" to a cache busting unique ID.
 */
function translate(params: React.ComponentProps<any>) {
  if (params && params.reload) {
    params.reload = Math.random();
  }
  return params;
}

function useSetReactNavContext(routes: Routes) {
  const reactNav = useNavigation<NavigationProp<any>>();

  const nav = {
    navTo: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => {
      const key = requireRouteKey(to, routes);
      if (to.style?.type === 'top') {
        reactNav.navigate(key, translate(params));
      } else {
        const action = StackActions.push(key, params);
        reactNav.dispatch(action);
      }
    },

    replace: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => {
      const key = requireRouteKey(to, routes);
      const action = StackActions.replace(key, params);
      reactNav.dispatch(action);
    },

    setParams: <S extends Screen<any>>(params: PropsFor<S>) => {
      reactNav.setParams(translate(params));
    },

    reset: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => {
      const key = requireRouteKey(to, routes);
      const action = CommonActions.reset({
        index: 0,
        routes: [{name: key, params}],
      });
      reactNav.dispatch(action);
    },

    back: () => reactNav.goBack(),
    backOk: () => reactNav.canGoBack(),
  };

  setInitialAppContext(NAV_CONTEXT_KEY, nav);
  setInitialAppContext(NAV_STATE_KEY, () => {
    const route = useRoute();
    return {
      routes,
      location: {
        route: route.name,
        screen: routes[route.name],
        params: route.params,
      },
    };
  });
}
