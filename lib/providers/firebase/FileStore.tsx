import {context} from '@toolkit/core/util/AppContext';
import {BaseModel, ModelClass, ModelUtil} from '@toolkit/data/DataStore';
import {
  FILE_STORE_PROVIDER_KEY,
  FileStore,
  StorageUri,
} from '@toolkit/data/FileStore';
import {useFirebaseStorage} from '@toolkit/experimental/storage/firebase/Storage';

function useFileStore<T extends BaseModel>(
  dataType: ModelClass<T>,
  field: keyof T,
): FileStore {
  const storage = useFirebaseStorage();
  async function upload(toUploadUri: string) {
    const path = `${ModelUtil.getName(dataType)}/${field.toString()}`;
    const result = await storage.upload(path, toUploadUri);
    return {httpUrl: result.displayUrl, storageUri: result.uri};
  }

  async function getUrl(storageUri: StorageUri) {
    return storage.download(storageUri);
  }

  return {upload, getUrl};
}

/**
 * Implementation of `FileStore` that uses Firebase Storage.
 *
 * Files are stored at /${instance}/${dataModelName}/${field}/${generatedUUID}.${ext},
 * e.g. "/favezilla/profile/pic/13i4n3a9sf0jq0rjq1.png"
 */
export const FIRESTORE_FILESTORE = context(
  FILE_STORE_PROVIDER_KEY,
  useFileStore,
);
