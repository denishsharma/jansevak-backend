import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class PermissionPolicy extends BasePolicy {
    /**
     * Check if the user can manage permissions of another user.
     * @param user
     * @param assignee
     */
    public async canManagePermission(user: User, assignee: User) {
        if (!await userHasPermissions(["MANAGE_PERMISSION"], user)) {
            return false;
        }

        // You cannot manage permissions of yourself.
        return user.id !== assignee.id;
    }
}
