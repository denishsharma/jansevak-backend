import { ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import Permission from "App/Models/Permission";
import User from "App/Models/User";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses from "App/Helpers/Responses";

/**
 * Permissions
 */
enum Permissions {
    // Action Permissions
    CAN_EDIT_OTHERS = "canEditOthers", // Do actions on other users
    CAN_EDIT_OWN = "canEditOwn", // Do actions on self

    // Login Permissions
    CAN_CHANGE_PHONE_NUMBER = "canChangePhoneNumber", // Can change phone number [remove]
    CAN_USE_PASSWORD = "canUsePassword", // Can use password to login [remove]
    CAN_USE_EMAIL = "canUseEmail", // Can use email to login [remove]

    // User Permissions
    WRITE_USER = "writeUser", // Can create, update, archive a user
    CAN_CREATE_USER = "canCreateUser", // Can create a user [remove]
    CAN_UPDATE_USER = "canUpdateUser", // Can update a user records [remove]
    CAN_ARCHIVE_USER = "canArchiveUser", // Can archive a user [remove]

    // Permission Permissions
    MANAGE_PERMISSION = "managePermission", // Can assign, revoke a permission

    // Profile Permissions
    CAN_UPDATE_PROFILE = "canUpdateProfile", // Can update profile details [remove]
    WRITE_PROFILE = "writeProfile", // Can update profile details

    // Group Permissions
    WRITE_GROUP = "writeGroup", // Can create, update, archive a group
    ADD_USER_TO_GROUP = "addUserToGroup", // Can add a user to any group
    CAN_CREATE_GROUP = "canCreateGroup", // Can create a group (general) [remove]
    CAN_ADD_USER_TO_GROUP = "canAddUserToGroup", // Can add a user to a group (general) [remove]
    CAN_ADD_FAMILY_MEMBER_TO_GROUP = "canAddFamilyMemberToGroup", // Can add a family member to a group (family)
                                                                  // [remove]

    // Announcement Permissions
    WRITE_ANNOUNCEMENT = "writeAnnouncement", // Can create, update, archive, publish an announcement
    CAN_CREATE_ANNOUNCEMENT = "canCreateAnnouncement", // Can create an announcement [remove]
    CAN_UPDATE_ANNOUNCEMENT = "canUpdateAnnouncement", // Can update an announcement [remove]
    CAN_ARCHIVE_ANNOUNCEMENT = "canArchiveAnnouncement", // Can archive an announcement [remove]

    // Question Permissions
    WRITE_QUESTION = "writeQuestion", // Can create, update, archive a question

    // Complaint Permissions [remove]
    CAN_CREATE_COMPLAINT = "canCreateComplaint", // Can create a complaint
    CAN_UPDATE_COMPLAINT = "canUpdateComplaint", // Can update a complaint
    CAN_ARCHIVE_COMPLAINT = "canArchiveComplaint", // Can archive a complaint
    CAN_UPDATE_COMPLAINT_STATUS = "canUpdateComplaintStatus", // Can update a complaint status
    CAN_UPDATE_COMPLAINT_PRIORITY = "canUpdateComplaintPriority", // Can update a complaint priority

    // Query Permissions
    WRITE_QUERY = "writeQuery", // Can create, update, archive a query
    WRITE_QUERY_CATEGORY = "writeQueryCategory", // Can create, update, archive a query category
    ADD_QUERY_COMMENT = "addQueryComment", // Can add a comment to a query
    ADD_QUERY_LOG = "addQueryLog", // Can add a log to a query

    // Ward Permissions
    WRITE_WARD = "writeWard", // Can create, update, archive a ward
    VIEW_WARD_USERS = "viewWardUsers", // Can view users in a ward
}


/**
 * Permission sets
 */
export const PermissionSets = {
    // Default permissions for a user (nagrik)
    defaultUser: [
        Permissions.CAN_EDIT_OWN,
        Permissions.CAN_USE_PASSWORD,
        Permissions.CAN_CHANGE_PHONE_NUMBER,
        Permissions.CAN_UPDATE_PROFILE,
        Permissions.CAN_CREATE_COMPLAINT,
        Permissions.CAN_ARCHIVE_COMPLAINT,
    ],
};

export async function checkAllowance(bouncer: HttpContextContract["bouncer"], response: HttpContextContract["response"], forUser: User, policy, action): Promise<void> {
    const allows = await bouncer.forUser(forUser).with(policy).allows(action);
    if (!allows) {
        return Responses.sendUnauthorizedResponse(response);
    }
}

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
