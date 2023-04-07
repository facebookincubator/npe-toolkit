/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {DeliveryMethod} from './NotificationTypes';

type NotificationChannelParams = {
  id: string;
  name: string;
  description: string;
  titleFormat: string;
  bodyFormat: string;
  defaultDeliveryMethod: DeliveryMethod;
};

export default class NotificationChannel {
  id: string;
  name: string;
  description: string;
  titleFormat: string;
  bodyFormat: string;
  defaultDeliveryMethod: DeliveryMethod;

  constructor(params: NotificationChannelParams) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.titleFormat = params.titleFormat;
    this.bodyFormat = params.bodyFormat;
    this.defaultDeliveryMethod = params.defaultDeliveryMethod;
  }

  getTitle(titleParams: Record<string, string> | null): string {
    return interpolate(this.titleFormat, titleParams);
  }

  getBody(bodyParams: Record<string, string> | null): string {
    return interpolate(this.bodyFormat, bodyParams);
  }
}

const interpolate = (
  format: string,
  params: Record<string, string> | null,
): string => {
  if (params == null) {
    return format;
  }
  const names = Object.keys(params);
  const vals = Object.values(params);
  // @ts-ignore Global check
  return new Function(...names, `return \`${format}\`;`)(...vals);
};

export const NOTIF_CHANNELS_KEY =
  contextKey<Record<string, NotificationChannel>>('npe.notif_channels');

export const useNotificationChannels = (): Record<
  string,
  NotificationChannel
> => {
  return useAppContext(NOTIF_CHANNELS_KEY);
};
