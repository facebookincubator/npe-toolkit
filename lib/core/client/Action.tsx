/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {useLogEvent} from '@toolkit/core/api/Log';

export type Handler = () => Promise<void> | void;

/**
 * ActionSpec is the underlying data structure for Actions.
 */
export type ActionSpec = {
  id: string;
  icon?: string;
  label: string;
  act: Handler;
};

/**
 * Actions are packaged behavior called as result of user actions (e.g. button click), or a system action
 * (background task execution), defined as a function to call + metadata about the function.
 *
 * * Metadata includes string ID (for logging and debugging), label, and optional icon
 * * Actions are defined with a handler function (either sync or async) that
 *   performs the action and the above metadata
 * * To enable using context (or any other hooks), Actions can be defined by providing
 *   a function that returns the handler and metadata.
 * * All metadata needs to be available synchronously - cannot make async requests to define
 *   the label, icon, etc.
 *
 * Example action:
 * ```
 * const GO_BACK_ACTION = () => {
 *   const nav = useNav();
 *
 *   return {
 *     id: 'GO_BACK',
 *     icon: 'chevron-left',
 *     label: 'go back',
 *     act: () => nav.back(),
 *   };
 * };
 * ```
 *
 */
export type Action = ActionSpec | (() => ActionSpec);

// Internal function for getting ActionSpec from an Action and executing hooks
function useToAction(action: Action): ActionSpec {
  if ('id' in action) {
    return action;
  } else {
    return action();
  }
}

/**
  * Components executing actions call useAction() hook during component rendering
  * to get an Action that can be used for rendering and callbacks.
  *
  * `useAction` does two things:
  * 1. Executes hooks correctly, so that Actions can use context
  * 2. Provides support for cross-cutting concerns such as logging

  *
  * Example:
  * ```
  * function ActionButton(props: {action: Action}) {
  *   const {id, icon, label, act} = useAction(action);
  *   return <Button icon={icon} onPress={() => act()}>{label}</Button>;
  * }
  * ```
  */
export function useAction(action: Action): ActionSpec {
  const result = useToAction(action);
  const logEvent = useLogEvent();

  async function act() {
    try {
      await result.act();
    } finally {
      // TODO: Log errors
      // TODO: Get app ID, user from context
      logEvent('ACTION_' + result.id);
    }
  }

  return {...result, act};
}
