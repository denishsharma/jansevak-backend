import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import validator from "validator";
import User from "App/Models/User";

export default class UsersController {
    public async updatePassword({ auth, request, response, bouncer }: HttpContextContract) {
        // check if user is authenticated
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        const { password, new_password, update_for } = request.only(["password", "new_password", "update_for"]);

        let userToUpdate = user;
        if (update_for) {
            const userToUpdate = await User.findBy("uuid", update_for);
            if (!userToUpdate) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));
            }
        }

        const allows = await bouncer.forUser(user).with("UserPolicy").allows("canUpdateUserPassword", userToUpdate);
        if (!allows) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to update password"));
        }

        // Check if password is valid
        if (!new_password || !password) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Password not provided"));
        }

        // Check if new password is valid
        if (!validator.isStrongPassword(new_password, { minLength: 8 })) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid new password"));
        }

        // Check if new password is same as old password
        if (new_password === password) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "New password cannot be same as old password"));
        }

        // If user is updating his own password, check if password matches
        if (userToUpdate.id === user.id) {
            // check if password matches
            const isPasswordValid = await user.verifyPassword(password);
            if (!isPasswordValid) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PASSWORD_DID_NOT_MATCH], "Invalid password"));
            }
        }

        user.password = new_password;
        await user.save();

        return response.status(200).json(Responses.createResponse({}, [ResponseCodes.PASSWORD_RESET_DONE, ResponseCodes.USER_UPDATED], "Password reset done"));
    }

    public async updateEmail({ auth, request, response }: HttpContextContract) {
        // check if user is authenticated
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        const { email } = request.only(["email"]);

        if (!email) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.EMAIL_NOT_PROVIDED], "Email not provided"));
        }

        if (!validator.isEmail(email)) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.BAD_INPUT], "Invalid email"));
        }

        user.email = email;
        await user.save();

        return response.status(200).json(Responses.createResponse({}, [ResponseCodes.USER_UPDATED], "User email updated"));
    }
}
