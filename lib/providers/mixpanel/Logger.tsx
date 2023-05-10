/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {LOG_CONTEXT_KEY, LogEvent, fullEventName} from '@toolkit/core/api/Log';
import {context} from '@toolkit/core/util/AppContext';
import {uuidv4} from '@toolkit/core/util/Util';

async function mixpanelRequest(endpoint: string, json: any) {
  const resp = await fetch(`https://api.mixpanel.com/${endpoint}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: `data=${JSON.stringify(json)}`,
  });
  const isError = (await resp.text()) === '0';
  if (isError) {
    throw new Error('Mixpanel request failed');
  }
}

export function MixpanelLogger(token: string) {
  function useMixpanelLogger() {
    return async (event: LogEvent) => {
      const {user, when, ...rest} = event;
      const insert_id = uuidv4();
      try {
        const mixpanelEvent = {
          event: fullEventName(event),
          properties: {
            distinct_id: user || 'anonymous',
            $insert_id: insert_id,
            time: when,
            token,
            ...rest,
          },
        };
        await mixpanelRequest('track', [mixpanelEvent]);
        const identityEvent = {
          $set: {dev: __DEV__},
          $distinct_id: user || 'anonymous',
          $token: token,
        };
        await mixpanelRequest('engage', [identityEvent]);
      } catch (e) {
        console.error(e);
      }
    };
  }

  return useMixpanelLogger;
}

export function mixpanelLogContext(token: string) {
  return context(LOG_CONTEXT_KEY, MixpanelLogger(token));
}
