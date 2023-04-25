/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {ActionItem} from '@toolkit/core/client/Action';
import {MayLoad} from '@toolkit/core/util/Loadable';

/**
 * Type of the screen
 * - "top" screens are shown in top-level app navigation elements (tabs or drawer nav)
 * - "modal" screens are shown in an overlay treatment and only can go back to the previous screen
 * - "standard" screens are used in any stack
 *
 * Default is "standard"
 */
export type ScreenType = 'top' | 'modal' | 'std';

/**
 * Hints for navigation display. These can be overridden by manually setting
 * up the navigation container for the app, however intent is that 95% of common
 * cases can be represented by one of these enums.
 *
 * - "full" is standard navigation
 * - "none" has no frame
 *
 * Default is "full". May be opportunities to add new types
 */
export type NavType = 'full' | 'none';

export interface ScreenProps {
  // Title of the screen. TODO: Allow overriding this asynchronously on page load
  title?: string;

  // Hints for how to render the screen in layout elements
  style?: {
    type?: ScreenType;
    nav?: NavType;
  };

  // A primary action to be shown in a FAB or similar
  mainAction?: ActionItem;

  // List of all top level actions available on this screen
  actions?: ActionItem[];

  // Parents are used when deep navigating to a screen that
  // needs to have a "back" button - the parent is pushed on the
  // stack before the screen
  parent?: Screen<any>;

  // Custom loading view for this page
  loading?: React.ComponentType<any>;
}

// All screens are also Loadable, for async data loading
/**
 * Screens are core top-level pages in an app. The core of a Screen is a
 * React Component that renders the content of the page, while leaving the shared
 * navigation chrome and elements to a Layout that can be used across
 * multiple logical screens in the app.
 *
 * Screens come along with metadata needed to render them in navigation contexts
 * (the `ScreenProps`). The goal of this metadata is to make screens self-contained,
 * so that adding a new page to an app just requries creating the component and
 * a single line of registration.
 *
 * Screens are designed to take advantage of React.Suspense and ErrorBoundaries
 * at a higher level of the component tree. Although not required, recommendation
 * is for screens to use these semantics - throw a promise when loading, and throw
 * an error if the screen can be rendered. To support this, recommendation for all
 * Layouts to include both a `<React.Suspense>` and an ErrorBoundary component
 * (this is easy to do with a `<TriState>`).
 *
 * The benefit of supporting these semantics is that you can write the screen
 * code assuming all of the async data is available, and not have conditional
 * logic throughout the component code. To support this, `Loadable` API
 * allows screens to define an async function that is executed before rendering
 * the page, but screens can also use their own semantics for loading data.
 */
export type Screen<P> = React.ComponentType<P> & ScreenProps & MayLoad<P>;
