/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {Text} from 'react-native';
import {ErrorHandler} from '@toolkit/core/client/TriState';
import {
  contextKey,
  setInitialAppContext,
  useAppContext,
} from '@toolkit/core/util/AppContext';
import {PropsFor, useAsyncLoad} from '@toolkit/core/util/Loadable';
import {Screen, ScreenProps} from '@toolkit/ui/screen/Screen';

export type LayoutProps = ScreenProps & {
  children?: React.ReactNode;
  onError?: ErrorHandler;
};

export type LayoutComponent = React.ComponentType<LayoutProps>;

type Props<S extends Screen<any>> = {
  layout: LayoutComponent;
  screen: S;
  params: PropsFor<S>;
};

export function ApplyLayout<S extends Screen<any>>(props: Props<S>) {
  const {layout: Layout, screen, params} = props;
  const baseScreenProps: ScreenProps = {
    title: screen.title || '',
    mainAction: screen.mainAction,
    actions: screen.actions || [],
    style: screen.style || {nav: 'full'},
    loading: screen.loading,
    parent: screen.parent,
  };
  const [screenProps, setScreenProps] =
    React.useState<ScreenProps>(baseScreenProps);
  const Component = useAsyncLoad(screen);

  const getScreenState = () => {
    return screenProps;
  };

  const setScreenState = (props: Partial<ScreenProps>) => {
    let dirty = false;
    for (const k in props) {
      const key = k as keyof ScreenProps;
      if (props[key] !== screenProps[key]) {
        dirty = true;
      }
    }
    if (dirty) {
      setTimeout(() => setScreenProps({...screenProps, ...props}), 0);
    }
  };

  const api = {getScreenState, setScreenState};

  setInitialAppContext(SCREEN_API_KEY, api);

  return (
    <Layout {...screenProps}>
      {Component ? (
        <Component {...params} />
      ) : (
        <Text>No Screen for "[location.route]"</Text>
      )}
    </Layout>
  );
}

type ScreenApi = {
  getScreenState: () => ScreenProps;
  setScreenState: (props: Partial<ScreenProps>) => void;
};

const SCREEN_API_KEY = contextKey<ScreenApi>('NPE.ScreenState');

export function useScreenState(): ScreenApi {
  return useAppContext(SCREEN_API_KEY);
}
