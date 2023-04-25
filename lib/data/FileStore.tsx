/**
 * API for storing and retrieving binary files.
 *
 * This is a higher level API that is integrated with the data store - each storage
 * backend may have primitives for direct platform storage access.
 */

import {contextKey, useAppContext} from '@toolkit/core/util/AppContext';
import {BaseModel, ModelClass} from '@toolkit/data/DataStore';

/**
 * URI to a backend storage system, using a custom scheme
 * to encode the location in a string.
 *
 * This is just a string, but tye type is defined for documentation purposes -
 * you shouldn't treat these as regular HTTP URLs.
 */
export type StorageUri = string;

export type UploadResult = {
  httpUrl: string;
  storageUri: StorageUri;
};

export type FileStore = {
  /**
   * Upload a file by URI to storage layer, return a `StorageUri`` to the file.
   * This `StorageUri` should then be set at the value in the linked datastore (as defined in
   * `useStorage()`), and the data store item created or updated.
   * This also returns an HTTP URL that can be used to render the file in an `<Image>` or similar.
   *
   * This higher level storage implementation has datastore integration for understanding if
   * there are references, and the stored file may deleted if there are no datastore objects
   * that reference it.
   *
   * `toUploadUri` may be a local file URI, HTTP URL, or base64 encoded data URI. However depending
   * on CORS restrictions, the HTTP URL may not be usable from web-based apps
   */
  upload: (toUploadUri: string) => Promise<UploadResult>;

  /**
   * Get a URL to a file, given the storage URI. This URL can be used to display an image or video
   * in react components. This may be a remote URL - you should cache the file locally if you want
   * faster loading or to ensure offline access.
   */
  getUrl: (storageUri: StorageUri) => Promise<string>;
};

export type FileStoreOpts = {
  maxBytes?: number;
};

export type FileStoreProvider = <T extends BaseModel>(
  dataType: ModelClass<T>,
  field: keyof T,
  opts: FileStoreOpts,
) => FileStore;

// Context key for providing app config using AppContext
export const FILE_STORE_PROVIDER_KEY = contextKey<FileStoreProvider>(
  'npe.datastore.storage',
);

export function useStorage<T extends BaseModel>(
  dataType: ModelClass<T>,
  field: keyof T,
  opts?: FileStoreOpts,
): FileStore {
  const fileStoreProvider = useAppContext(FILE_STORE_PROVIDER_KEY);
  return fileStoreProvider(dataType, field, opts ?? {});
}
