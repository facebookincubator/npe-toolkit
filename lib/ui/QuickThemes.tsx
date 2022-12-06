/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {DefaultTheme} from 'react-native-paper';
import {Theme} from 'react-native-paper/lib/typescript/types';

// A few themes you can play with to get an app started.
// Once your app is mature, you'll probably want to work with UX to
// come up with your own unique style :)
// Couple of places to go to find theme ideas:
// - https://www.materialpalette.com/
// - https://saruwakakun.com/en/material-color

export const PURPLE_AND_GREEN: Theme = {
  // Purple and green! (it's not as bad as it sounds...)
  ...DefaultTheme,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    primary: '#512da8',
    accent: '#66bb6a',
    text: '#212121',
    background: '#FAFAFA',
  },
};

export const FB_BLUISH: Theme = {
  ...DefaultTheme,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    primary: '#303F9F',
    accent: '#03A9F4',
    text: '#3F51B5',
    background: '#FAFAFA',
  },
};

export const LIME: Theme = {
  ...DefaultTheme,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8BC34A',
    accent: '#FF8A65',
    background: '#F0F0F0',
  },
};

export const CRAZY_CLOWN: Theme = {
  ...DefaultTheme,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF5722',
    accent: '#0000FF',
    text: '#008000',
    background: '#FFFF40',
  },
};

export const BLACK_AND_WHITE: Theme = {
  ...DefaultTheme,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#202020',
    accent: '#0000FF',
    text: '#404040',
    background: '#FFFFFF',
  },
};
