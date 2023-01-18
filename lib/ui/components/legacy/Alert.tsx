/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// TODO: Split into an alert UI service and a pluggable implementation

import {Alert, Platform} from 'react-native';

/**
 * RN Alert (https://reactnative.dev/docs/alert) is not supported in
 * react-native-web yet (https://github.com/necolas/react-native-web#modules).
 *
 * This seems reasonable to fill the gap for now.
 * Based on https://github.com/necolas/react-native-web/issues/1026#issuecomment-679102691
 */

const _alert = (
  title: string,
  message?: string,
  buttons?: any[] | null,
): void => {
  const result = window.confirm([title, message].filter(Boolean).join('\n'));
  if (buttons == null) {
    return;
  }
  if (result) {
    const confirmOption = buttons.find(({style}) => style !== 'cancel');
    confirmOption &&
      typeof confirmOption.onPress === 'function' &&
      confirmOption.onPress();
  } else {
    const cancelOption = buttons.find(({style}) => style === 'cancel');
    cancelOption &&
      typeof cancelOption.onPress === 'function' &&
      cancelOption.onPress();
  }
};

// $FlowIgnore
const alert = Platform.OS === 'web' ? _alert : Alert.alert;

export default alert;
