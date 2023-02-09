import { ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import Permission from "App/Models/Permission";
import User from "App/Models/User";

/**
 * Permissions
 */
enum Permissions {
    // Action Permissions
    CAN_EDIT_OTHERS = "canEditOthers", // Do actions on other users
    CAN_EDIT_OWN = "canEditOwn", // Do actions on self

    // Login Permissions
    CAN_USE_PASSWORD = "canUsePassword",
    CAN_USE_EMAIL = "canUseEmail",

    // User Permissions
    CAN_CREATE_USER = "canCreateUser",
    CAN_UPDATE_USER = "canUpdateUser",
    CAN_ARCHIVE_USER = "canArchiveUser",

    // Permission Permissions
    CAN_ASSIGN_PERMISSION = "canCreatePermission",
    CAN_REVOKE_PERMISSION = "canRevokePermission",

    // Profile Permissions
    CAN_UPDATE_PROFILE = "canUpdateProfile",

    // Family Permissions
    CAN_ADD_MEMBER = "canAddMember",
    CAN_REMOVE_MEMBER = "canRemoveMember",
    CAN_UPDATE_MEMBER = "canUpdateMember",
    CAN_ASSIGN_MEMBER = "canAssignMember",
}


/**
 * Permission sets
 */
export const PermissionSets = {
    // Default permissions for a user
    defaultUser: [
        Permissions.CAN_USE_PASSWORD,
        Permissions.CAN_ASSIGN_PERMISSION,
    ],
};

/**
 * Get the permissions with their values
 * @returns {object}
 */
export function getPermissions(): object {
    const permissionWithValues = Object.entries(Permissions).map(([key, value]) => {
        return { [key]: value };
    });

    return Object.assign({}, ...permissionWithValues);
}

/**
 * Get the permission string for the given permissions
 * @param {Permissions[]} permissions
 * @returns {string}
 */
export function ifHasPermissions(permissions: Permissions[]): string {
    return "can:" + permissions.join(",");
}

/**
 * Inner function to check if the user has the required permissions
 * Check if the user has all the required permissions
 * @param {Array<Permissions>} requiredPermissions
 * @param {ManyToMany<typeof Permission>} userPermissions
 * @returns {boolean}
 */
export function hasRequiredPermission(requiredPermissions: Array<keyof typeof Permissions>, userPermissions: ManyToMany<typeof Permission>): boolean {
    // get the slugs of the user permissions
    const userPermissionSlugs = userPermissions.map((permission) => permission.slug);
    // check if the user has all the required permissions
    return requiredPermissions.every((permissionName) => userPermissionSlugs.includes(Permissions[permissionName]));
}

/**
 * Inner function to check if the user has any permissions
 * @param {Array<keyof typeof Permissions>} requiredPermissions
 * @param {ManyToMany<typeof Permission>} userPermissions
 * @returns {boolean}
 */
export function hasAnyPermission(requiredPermissions: Array<keyof typeof Permissions>, userPermissions: ManyToMany<typeof Permission>): boolean {
    // get the slugs of the user permissions
    const userPermissionSlugs = userPermissions.map((permission) => permission.slug);
    // check if the user has any permissions
    return requiredPermissions.some((permissionName) => userPermissionSlugs.includes(Permissions[permissionName]));
}

/**
 * Check if the user has all the required permissions
 * @param {Array<keyof typeof Permissions>} requiredPermissions
 * @param {User} user
 * @returns {Promise<boolean>}
 */
export async function userHasPermissions(requiredPermissions: Array<keyof typeof Permissions>, user: User): Promise<boolean> {
    await user.load("permissions");
    return user.hasPermissions(requiredPermissions);
}

export async function userHasAnyPermissions(requiredPermissions: Array<keyof typeof Permissions>, user: User): Promise<boolean> {
    await user.load("permissions");
    return user.anyPermissions(requiredPermissions);
}

/**
 * Get the permission set ids
 * @param {keyof typeof PermissionSets} permissionSet
 * @returns {Promise<any[]>}
 */
export async function getPermissionSet(permissionSet: keyof typeof PermissionSets) {
    const _permissions = PermissionSets[permissionSet];
    const permissionSlugs = _permissions.map((permission) => permission);

    const permissions = await Permission.query().whereIn("slug", permissionSlugs).exec();

    if (permissions.length === 0) {
        return [];
    }

    return permissions.map((permission) => permission.id);
}

/**
 * Get the permission names
 * @param {User} user
 * @returns {Promise<string[]>}
 */
export async function getPermissionNames(user: User) {
    await user.load("permissions");
    return user.permissions.map((permission) => permission.slug);
}

export default Permissions;