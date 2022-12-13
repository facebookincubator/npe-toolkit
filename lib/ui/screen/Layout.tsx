/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Text} from 'react-native';
import {PropsFor, useAsyncLoad} from '@toolkit/core/util/Loadable';
import {Screen, ScreenProps} from '@toolkit/ui/screen/Screen';

export type LayoutProps = ScreenProps & {
  children?: React.ReactNode;
};

export type LayoutComponent = React.ComponentType<LayoutProps>;

type Props<S extends Screen<any>> = {
  layout: LayoutComponent;
  screen: S;
  params: PropsFor<S>;
};

export function ApplyLayout<S extends Screen<any>>(props: Props<S>) {
  const {layout: Layout, screen, params} = props;

  const layoutProps = {
    title: screen.title || '',
    mainAction: screen.mainAction,
    actions: screen.actions || [],
    style: screen.style || {nav: 'full'},
    loading: screen.loading,
    parent: screen.parent,
  };
  const Component = useAsyncLoad(screen);

  return (
    <Layout {...layoutProps}>
      {Component ? (
        <Component {...params} />
      ) : (
        <Text>No Screen for "[location.route]"</Text>
      )}
    </Layout>
  );
}
