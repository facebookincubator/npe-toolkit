/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Action} from '@toolkit/core/client/Action';
import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {PropsFor} from '@toolkit/core/util/Loadable';
import {Screen} from '@toolkit/ui/screen/Screen';

/**
 * Core navigation API.
 *
 * Goal is that most code won't need to understand the underlying navigation system -
 * they can just say "go to this screen" and the right things will happen.
 *
 * APIs should cover 95% of navigation use cases (and we need to extend when they don't),
 * but it's OK for code to break out of the Nav API and call to the underlying
 * `react-navigation` (or other nav) primitives if needed.
 *
 * Features:
 * - Only need to know the component you are navigating to,
 *   don't need to look up a path or ID of the component
 * - Typesafe props for the component
 *
 * Extensions:
 * - Need a spec for translating serializable URL params to non-string props
 * - May need a non-typesafe option
 */
export type Nav = {
  // Navigate to a screen, pushing new screen on the nav stack when appropriate
  navTo: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => void;

  // Navigate to a screen, replacing current position in the nav stack
  replace: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => void;

  // Set params for the current screen, replacing current position in the nav stack
  setParams: <S extends Screen<any>>(params: PropsFor<S>) => void;

  // Reset the navigation state, with new initial screen
  reset: <S extends Screen<any>>(to: S, params?: PropsFor<S>) => void;

  // Go back to previous screen in logical nav stack (if available)
  back: () => void;

  // Whether there is a screen to go back to
  backOk: () => boolean;
};

export const NAV_CONTEXT_KEY = contextKey<Nav>('core.nav');

/**
 * Get a Nav instance to be able to send navigation events.
 */
export function useNav() {
  return useAppContext(NAV_CONTEXT_KEY);
}

/**
 * All Screens used in an app.
 *
 * The key of this map is used for logging and deep linking.
 * The value is the screen component.
 *
 * Conventionally you can use the name of your component as the name of the screen -
 * this makes the definition simple, as you can use
 * ```
 * const ROUTES: Routes = { Home, Settings, Search };
 * ```
 */
export type Routes = {
  [key: string]: Screen<any>;
};

type NavigationState = {
  routes: Routes;
  location: {
    route: string;
    screen: Screen<any>;
    params: any;
  };
};

export const NAV_STATE_KEY = contextKey<() => NavigationState>('core.navState');

export function useNavState() {
  const provider = useAppContext(NAV_STATE_KEY);
  return provider();
}

export type NavSpec = {
  //  `getScreen` variant allows for late binding
  to: Screen<any> | {getScreen: () => Screen<any>};
  label: string;
  icon: string;
  params?: any;
};
/**
 * `Action` to enacpsulate a navigation event
 * @returns
 */
export function navToAction(spec: NavSpec): Action {
  const {to, label, icon, params} = spec;

  return () => {
    const {navTo} = useNav();

    const screen = 'getScreen' in to ? to.getScreen() : to;
    const id = (screen.displayName ?? label).toUpperCase();

    return {id, label, icon, act: () => navTo(screen, params)};
  };
}
