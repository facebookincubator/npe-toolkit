/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React from 'react';
import {Image, ImageSourcePropType} from 'react-native';
import {useTheme} from 'react-native-paper';
import {IconProps} from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';

/**
 * Utility to load icons by name.
 *
 * Name is of form "prefix:localName". Prefixes are
 * registered and map to icon font libraries, or
 * "image" maps to a set of images the app needs to register.
 *
 * To register an icon font library:
 * ```
 * import {Ionicons} from '@expo/vector-icons';
 *
 * registerIconProvider('ion', Ionicons);
 * ```
 *
 * To register an image:
 * ```
 * registerImageIcon({loop: require('./assets/loop.png'});
 * ```
 *
 * To use an icon, can use any React Native Paper API with icon prop:
 * ```
 * <IconButton name="ion:beer-outline" onPress={doSomething}/>
 * <IconButton name="image:loop" onPress={doSomething}/>
 * ```
 */
export const Icon = (props: Partial<IconProps>) => {
  const {name = '', color, ...rest} = props;

  // Split into prefix and localName within that icon namespace
  const parts = name.split(':', 2);
  const [prefix, localName] = parts.length > 1 ? parts : ['mci', parts[0]];

  const Provider = ICON_PROVIDERS[prefix];
  if (!Provider) {
    throw Error(`Icon pack not found for "${prefix}"`);
  }

  return (
    <IconPackProvider
      provider={Provider}
      name={localName}
      color={color}
      {...rest}
    />
  );
};

function IconPackProvider(props: any) {
  const theme = useTheme();
  const {provider: Provider, color = theme.colors.text, ...rest} = props;
  return <Provider color={color} {...rest} />;
}

type IconProvider = React.ComponentType<Partial<IconProps>>;
const ICON_PROVIDERS: Record<string, IconProvider> = {};

export function registerIconPack(prefix: string, pack: any) {
  ICON_PROVIDERS[prefix] = pack;
}

function ImageProvider(props: IconProps) {
  const {name: id, color, size} = props;
  return (
    <Image
      source={IMAGE_ICONS[id]}
      style={{tintColor: color, width: size, height: size}}
    />
  );
}

const IMAGE_ICONS: Record<string, ImageSourcePropType> = {};

export function registerImageIcons(
  imageMap: Record<string, ImageSourcePropType>,
) {
  for (const key in imageMap) {
    IMAGE_ICONS[key] = imageMap[key];
  }
  registerIconPack('image', ImageProvider);
}
