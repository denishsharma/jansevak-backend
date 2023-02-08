import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { string } from "@ioc:Adonis/Core/Helpers";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class AuthPolicy extends BasePolicy {
    public async canLoginUsingPassword(user: User) {
        // If the user is not registered, they cannot log in using password.
        if (!user.isRegistered) {
            return false;
        }

        // If the user don't have the permission to use password, they cannot login using password.
        if (!await userHasPermissions(["CAN_USE_PASSWORD"], user)) {
            return false;
        }

        // If the user has already set a password, they can login using password.
        return !(user.password === null || user.password === undefined || string.isEmpty(user.password));
    }

    public async canLoginUsingEmail(user: User) {
        // If the user is not registered, they cannot login using email.
        if (!user.isRegistered) {
            return false;
        }

        // If the user dont have the permission to use email, they cannot login using email.
        if (!await userHasPermissions(["CAN_USE_EMAIL"], user)) {
            return false;
        }

        // If the user has already set an email, they can login using email.
        return !(user.email === null || user.email === undefined || string.isEmpty(user.email));
    }
}
