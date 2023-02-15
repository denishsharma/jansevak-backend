import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";

export default class QuestionPolicy extends BasePolicy {
    /**
     * Determine if the user can create a new question
     * @param user
     */
    public async canCreateQuestion(user: User) {
        // check if user has permission to create question
        return await userHasPermissions(["CAN_CREATE_QUESTION"], user);
    }

    /**
     * Determine if the user can update a question
     * @param user
     */
    public async canUpdateQuestion(user: User) {
        // check if user has permission to update question
        return await userHasPermissions(["CAN_UPDATE_QUESTION"], user);
    }
}
