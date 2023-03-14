import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class QueryPolicy extends BasePolicy {
    public async canWriteQuery(createdBy: User) {
        // check if user has permission to write query
        if (await userHasPermissions(["WRITE_QUERY"], createdBy)) return true;

    }

    /**
     * Determine if the user can write a query
     * @param user
     */
    public async canWriteQueryCategory(user: User) {
        // check if user has permission to write query category
        return await userHasPermissions(["WRITE_QUERY_CATEGORY"], user);
    }
}
