import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class WardPolicy extends BasePolicy {
    /**
     * Determine if the user can view ward users
     * @param user
     */
    public async canViewWardUsers(user: User) {
        return await userHasPermissions(["VIEW_WARD_USERS"], user);
    }

    /**
     * Determine if the user can write ward
     * @param user
     */
    public async canWriteWard(user: User) {
        return await userHasPermissions(["WRITE_WARD"], user);
    }

}
