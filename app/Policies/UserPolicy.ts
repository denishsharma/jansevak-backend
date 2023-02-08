import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class UserPolicy extends BasePolicy {
    public async canUpdateUser(user: User) {
        // You cannot update a user unless you have the permission to do so.
        if (!await userHasPermissions(["CAN_UPDATE_USER"], user)) {
            return false;
        }

        // You cannot update other users unless you have the permission to do so.
        return await userHasPermissions(["CAN_EDIT_OTHERS"], user);
    }

    public async canUpdateUserPassword(user: User, userToUpdate: User) {
        // You can update your own password if you have "CAN_USE_PASSWORD" permission.
        if (user.id === userToUpdate.id) {
            return await userHasPermissions(["CAN_USE_PASSWORD"], user);
        }

        // You cannot update other users password unless you have the permission to do so.
        return await userHasPermissions(["CAN_EDIT_OTHERS", "CAN_UPDATE_USER"], user);

    }

    public async canUpdateUserEmail(user: User, userToUpdate: User) {
        // You can update your own email if you have "CAN_USE_EMAIL" permission.
        if (user.id === userToUpdate.id) {
            return await userHasPermissions(["CAN_USE_EMAIL"], user);
        }

        // You cannot update other users email unless you have the permission to do so.
        return await userHasPermissions(["CAN_EDIT_OTHERS", "CAN_UPDATE_USER"], user);
    }

    public async canArchiveUser(user: User, userToArchive: User) {
        // You cannot archive yourself.
        if (user.id === userToArchive.id) {
            return false;
        }

        // You cannot archive other users unless you have the permission to do so.
        return await userHasPermissions(["CAN_ARCHIVE_USER", "CAN_EDIT_OTHERS"], user);
    }
}
