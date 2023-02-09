import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class ProfilePolicy extends BasePolicy {
    /**
     * Check if the user can update the profile
     * @param {User} user
     * @param {User} userToUpdate
     * @returns {Promise<boolean>}
     */
    public async canUpdateProfile(user: User, userToUpdate: User) {
        // Check if the user has the permission to update their own profile
        if (user.id === userToUpdate.id) {
            return userHasPermissions(["CAN_UPDATE_PROFILE"], user);
        }

        // Check if the user has the permission to update other users' profiles
        return userHasPermissions(["CAN_UPDATE_PROFILE", "CAN_EDIT_OTHERS"], user);
    }
}
