import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";

export default class Verified {
    public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
        // check if user is logged in
        const user = await getLoggedInUser(auth);

        if (!user) {
            return Responses.sendUnauthenticatedResponse(response);
        }

        // check if user has completed profile
        if (!user.isSetupCompleted) {
            return response.status(403).json(Responses.createResponse({}, [ResponseCodes.PROFILE_SETUP_NOT_COMPLETED], "Profile setup not completed"));
        }

        // check if user is verified
        // if (!user.) {
        //     return response.status(403).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_VERIFIED], "User
        // not verified")); }

        await next();
    }
}
