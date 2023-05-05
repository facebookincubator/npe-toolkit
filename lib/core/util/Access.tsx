/**
 * Utilities to allow client code to check access levels.
 */
import {
  BaseModel,
  Model,
  ModelClass,
  ModelUtil,
  useDataStore,
} from '@toolkit/data/DataStore';

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
 * Datastore type that is only accessible if you are on the allowlist.
 *
 * Use `"check_allowlist": {"*": ['allowlist']}` in privacy rules.
 */
@Model({name: 'check_allowlist'})
export class CheckAllowlist extends BaseModel {}

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
 * Check if user has access to a give datastore table
 */
export function useCheckAccess(type: ModelClass<BaseModel>, ifAccess: boolean) {
  const datastore = useDataStore(type);

  return async () => {
    try {
      await datastore.getAll();
      return ifAccess;
    } catch (e: any) {
      return !ifAccess;
    }
  };
}

/**
 * Check if the current user has the admin role
 */
export function useHasAdminRole() {
  return useCheckAccess(CheckAdmin, true);
}

/**
 * Check if the current user is on the allowlist
 */
export function useOnAllowlist() {
  return useCheckAccess(CheckAllowlist, true);
}

/**
 * Check if privacy rules are enabled
 */
export function usePrivacyRulesEnabled() {
  return useCheckAccess(CheckPrivacy, false);
}
