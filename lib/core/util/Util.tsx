/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

export function uuidv4(): string {
  /* eslint-disable no-bitwise */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function setDefaultTrustedTypePolicies(): void {
  // Only set policies if trusted types are supported by the browser
  // @ts-ignore
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    // @ts-ignore
    window.trustedTypes.createPolicy('default', {
      createScriptURL: (url: string, _sink: any) => {
        const {hostname} = new URL(url);
        if (hostname == 'connect.facebook.net') {
          return url;
        }
        throw new Error(
          'Violation of the Trusted Types policy. You are trying to use not allowed URL: ' +
            url,
        );
      },
    });
  }
}
