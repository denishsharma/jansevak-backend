import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class PermissionPolicy extends BasePolicy {
    public async assignPermissionToUser(user: User, assignee: User) {
        if (!await userHasPermissions(["CAN_ASSIGN_PERMISSION"], user)) {
            return false;
        }
        // You cannot assign permissions to yourself.
        return user.id !== assignee.id;
    }

    public async revokePermissionFromUser(user: User, assignee: User) {
        if (!await userHasPermissions(["CAN_REVOKE_PERMISSION"], user)) {
            return false;
        }
        // You cannot revoke permissions from yourself.
        return user.id !== assignee.id;
    }
}
