/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {bottomTabLayout} from '@toolkit/ui/layout/BottomTabLayout';
import {ModalLayout} from '@toolkit/ui/layout/LayoutBlocks';
import {layoutSelector} from '@toolkit/ui/layout/LayoutSelector';
import {topbarLayout} from '@toolkit/ui/layout/TopbarLayout';
import {LayoutComponent} from '@toolkit/ui/screen/Layout';
import {Screen} from '@toolkit/ui/screen/Screen';

export type NavItem = {
  icon: string;
  title: string;
  screen: Screen<any>;
  route: string; // Temporary until all is switched to screens
};

type TabLayoutProps = {
  tabs: NavItem[];
  headerRight: NavItem[];
  loginScreen?: Screen<any>;
};

/**
 * @deprecated
 *
 * Temporary bridge from old style `tabLayout`, which had a big switch statement,
 * to using a layout selector which makes it easir to mix and match layouts.
 */
export function tabLayout(tabProps: TabLayoutProps): LayoutComponent {
  const {tabs, headerRight, loginScreen} = tabProps;

  const nav = {
    main: tabs,
    extra: headerRight,
  };
  return layoutSelector({
    base: bottomTabLayout(nav),
    desktopWeb: topbarLayout(nav),
    modal: ModalLayout,
    loginScreen,
  });
}
