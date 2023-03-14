import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class QuestionPolicy extends BasePolicy {
    /**
     * Determine if the user can write a question
     * @param user
     */
    public async canWriteQuestion(user: User) {
        // check if user has permission to write question
        return await userHasPermissions(["WRITE_QUESTION"], user);
    }
}
