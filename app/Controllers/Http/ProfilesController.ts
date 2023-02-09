import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import User from "App/Models/User";
import { UserTypes } from "App/Helpers/Authentication";

export default class ProfilesController {
    public async updateProfile({ auth, request, response, params, bouncer }: HttpContextContract) {
        // Check if the user is authenticated
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // Get the user to update
        let userToUpdate: User;
        const { userToUpdateId } = params;

        if (userToUpdateId) {
            const _userToUpdate = await User.findBy("uuid", userToUpdateId);

            // Check if user to update exists
            if (!_userToUpdate) {
                return response.status(404).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));
            }

            userToUpdate = _userToUpdate;
        } else {
            // If the user to update is not specified, then update the authenticated user
            userToUpdate = user;
        }

        // Check if the user is authorized to update the profile
        const allows = await bouncer.forUser(user).with("ProfilePolicy").allows("canUpdateProfile", userToUpdate);
        if (!allows) {
            return response.status(403).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // Load the profile and address of the user to update
        await userToUpdate.load("profile");

        // Get the profile data from the request
        const {
            first_name,
            middle_name,
            last_name,
            aadhar_number,
            pan_number,
            voter_id_number,
            email,
            birth_date,

            // Address
            address_line_1,
            address_line_2,
            district,
            city,
            state,
            pincode,
        } = request.only(["first_name", "middle_name", "last_name", "aadhar_number", "pan_number", "voter_id_number", "email", "birth_date", "address_line_1", "address_line_2", "district", "city", "state", "pincode"]);

        // Update the profile and address
        const profile = user.profile;
        await profile.load("address");

        const address = profile.address;

        if (!userToUpdate.isSetupCompleted && userToUpdate.userType !== UserTypes.ADMIN) {
            if (!first_name || !last_name || !email || !birth_date || !address_line_1 || !district || !city || !state || !pincode) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PROFILE_DATA_MISSING], "Profile data missing"));
            }
        }

        await address.merge({
            addressLine1: address_line_1,
            addressLine2: address_line_2,
            district,
            city,
            state,
            pincode,
        }).save();

        await profile.merge({
            firstName: first_name,
            middleName: middle_name,
            lastName: last_name,
            aadharNumber: aadhar_number,
            panNumber: pan_number,
            voterIdNumber: voter_id_number,
            email,
            birthDate: birth_date,
        }).save();

        const codes: ResponseCodes[] = [];
        let message: string;

        // Check if the profile setup is completed
        if (userToUpdate.isSetupCompleted) {
            codes.push(ResponseCodes.PROFILE_UPDATED);
            message = "Profile updated";
        } else {
            // If the profile setup is not completed, then mark it as completed
            userToUpdate.isSetupCompleted = true;
            await userToUpdate.save();
            codes.push(ResponseCodes.PROFILE_SETUP_COMPLETED);
            message = "Profile setup completed";
        }

        return response.status(200).json(Responses.createResponse({}, codes, message));
    }
}
