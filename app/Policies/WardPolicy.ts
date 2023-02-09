import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class WardPolicy extends BasePolicy {
    public async canViewWardUsers(user: User) {
        return await userHasPermissions(["CAN_VIEW_WARD_USERS"], user);
    }

    public async canCreateWard(user: User) {
        return await userHasPermissions(["CAN_CREATE_WARD"], user);
    }

    public async canArchiveWard(user: User) {
        return await userHasPermissions(["CAN_ARCHIVE_WARD"], user);
    }
}
