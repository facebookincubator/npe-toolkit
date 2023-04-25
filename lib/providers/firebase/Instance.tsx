import {AppConfig} from '@toolkit/core/util/AppConfig';
import {Opt} from '@toolkit/core/util/Types';

/**
 * Get the instance prefix used to namespace and separate app functionality,
 * based on the `AppConfig`.
 */
export function getInstanceFor(appConfig: AppConfig) {
  const {dataEnv, product} = appConfig;

  if (dataEnv === 'prod') {
    return product;
  } else if (dataEnv === 'staging') {
    return `${product}-staging`;
  } else if (dataEnv != null) {
    return dataEnv;
  } else {
    return null;
  }
}

/**
 * Get the firestore prefix based on instance
 */
export function getFirestorePrefix(dataEnv: Opt<string>) {
  return dataEnv != null ? `instance/${dataEnv}/` : '';
}

/**
 * Get the storage prefix based on instance.
 */
export function getStoragePrefix(dataEnv: Opt<string>) {
  return dataEnv != null ? `${dataEnv}/` : '';
}

/**
 * Get the function prefix based on instance.
 */
export function getFunctionsPrefix(dataEnv: Opt<string>) {
  return dataEnv != null ? `${dataEnv}-` : '';
}
