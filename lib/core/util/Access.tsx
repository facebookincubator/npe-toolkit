/**
 * Utilities to allow client code to check access levels.
 */
import {BaseModel, Model, useDataStore} from '@toolkit/data/DataStore';

/**
 * Datastore type that is only accessible to admin users.
 * If privacy is enabled and user isn't in an admin role,
 * all calls will fail.
 *
 * Use `"check_admin": {"*": ['admin']}` in privacy rules.
 */
@Model({name: 'check_admin'})
export class CheckAdmin extends BaseModel {}

/**
 * Datastore type that is never accesible.
 * If privacy is enabled this should always fail.
 *
 * No privacy rule needed - by default there should
 * be no access to this type.
 */
@Model({name: 'check_privacy'})
export class CheckPrivacy extends BaseModel {}

/**
 * Check if the current user has the admin role
 */
export function useHasAdminRole() {
  const checkAdminStore = useDataStore(CheckAdmin);

  return async () => {
    try {
      await checkAdminStore.getAll();
      return true;
    } catch (e: any) {
      return false;
    }
  };
}

/**
 * Check if privacy rules are enabled
 */
export function usePrivacyRulesEnabled() {
  const checkPrivacyStore = useDataStore(CheckPrivacy);

  return async () => {
    try {
      await checkPrivacyStore.getAll();
      return true;
    } catch (e: any) {
      return false;
    }
  };
}
