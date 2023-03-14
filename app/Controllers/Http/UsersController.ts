import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { schema, validator } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";
import { getLoggedInUser, OtpTypes, UserTypes, UserVerificationStatuses, verifyOTP } from "App/Helpers/Authentication";
import ValidationException from "App/Exceptions/ValidationException";
import Ward from "App/Models/Ward";
import { DateTime } from "luxon";
import CreateNagarikValidator, { CreateNagarikSchema } from "App/Validators/CreateNagarikValidator";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import console from "console";
import Drive from "@ioc:Adonis/Core/Drive";
import { CreateJansevakDataSchema, CreateJansevakDataSchemaMessages } from "App/Helpers/Validators";

export default class UsersController {
    /**
     * Update user password
     * @param auth
     * @param request
     * @param response
     * @param bouncer
     */
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

    /**
     * Update user email
     * @param auth
     * @param request
     * @param response
     */
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


    public async newNagarik({ auth, response, request }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create new nagarik
        /* Write Logic Here */

        // check if request is valid. check for CERT
        const { cert: _certRaw } = request.only(["cert"]);
        if (!_certRaw) return Responses.sendInvalidRequestResponse(response, "CERT not provided");
        const cert = JSON.parse(_certRaw);
        const { otp: certOtp, sig: certSig } = cert;

        // check if CERT is valid
        const {
            isValid: isCertValid,
            payload: certPayload,
        } = await verifyOTP(user, OtpTypes.SERVICE_NEW_NAGARIK, certOtp, certSig);
        if (!isCertValid) return Responses.sendInvalidCertificateResponse(response);

        // get required data
        const { user: _userRaw, profile: _profileRaw } = request.only(["user", "profile"]);
        console.log(_userRaw, _profileRaw);
        const [_user, _profile] = [_userRaw, _profileRaw].map((raw) => JSON.parse(raw));
        const _avatar = request.file("avatar");

        // validate request with validator and schema
        let validatedData: CreateNagarikSchema;
        try {
            validatedData = await validator.validate({
                schema: CreateNagarikValidator.schema,
                data: {
                    user: _user,
                    profile: _profile,
                    avatar: _avatar,
                },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // check if cert is for new nagarik (skip if user is admin)
        if (validatedData.user.phone_number !== certPayload.service.phone_number) return Responses.sendInvalidRequestResponse(response, "CERT check invalid for new nagarik");

        // create new user
        const newNagarikUser = await User.create({
            phoneNumber: validatedData.user.phone_number,
            userType: UserTypes.NAGRIK,
            isRegistered: true,
            isSetupCompleted: true,
            isVerified: true,
            registeredAt: DateTime.now(),
        });

        // create nagarik profile
        const newNagarikProfile = await newNagarikUser.related("profile").create({
            firstName: validatedData.profile.first_name,
            middleName: validatedData.profile.middle_name,
            lastName: validatedData.profile.last_name,
            gender: validatedData.profile.gender,
            email: validatedData.profile.email,
            birthDate: validatedData.profile.birth_date,
            aadharNumber: validatedData.profile.aadhar_number,
            panNumber: validatedData.profile.pan_number,
            voterIdNumber: validatedData.profile.voter_id_number,
        });

        // create profile avatar
        if (validatedData.avatar) {
            try {
                await validatedData.avatar.moveToDisk("./");
                const avatarAttachment = await Attachment.create({
                    clientName: validatedData.avatar.clientName,
                    fileName: validatedData.avatar.fileName,
                    filePath: validatedData.avatar.filePath,
                    fileType: validatedData.avatar.extname,
                    mimeType: validatedData.avatar.type + "/" + validatedData.avatar.subtype,
                    referenceType: PolymorphicType.Profile,
                    referenceId: newNagarikProfile.id,
                });

                newNagarikProfile.avatar = await Drive.getUrl(avatarAttachment.filePath);
                await newNagarikProfile.save();
            } catch (e) {
                throw new UnknownErrorException(e.message, e.messages);
            }
        }

        // create profile address
        await newNagarikProfile.related("address").create({
            addressLineOne: validatedData.profile.address.address_line_1,
            addressLineTwo: validatedData.profile.address.address_line_2,
            pincode: validatedData.profile.address.pincode,
            district: validatedData.profile.address.district,
            city: validatedData.profile.address.city,
            state: validatedData.profile.address.state,
            country: "IN",
        });

        // create user allocation
        await newNagarikUser.related("allocation").create({
            wardId: await Ward.query().where("code", validatedData.user.ward).firstOrFail().then((ward) => ward.id),
            allocatedTo: await User.query().where("uuid", validatedData.user.jansevak).firstOrFail().then((user) => user.id),
            verifiedBy: user.id,
            createdBy: user.id,
            verification: UserVerificationStatuses.VERIFIED,
            verifiedAt: DateTime.now(),
        });

        return response.status(200).json(Responses.createResponse(newNagarikUser, [ResponseCodes.USER_CREATED], "New Nagarik created"));
    }

    public async newJansevak({ auth, response, request }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create new nagarik
        /* Write Logic Here */

        // get required data
        const { user: _userRaw, profile: _profileRaw } = request.only(["user", "profile"]);
        const [_user, _profile] = [_userRaw, _profileRaw].map((raw) => JSON.parse(raw));
        const _avatar = request.file("avatar");

        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create(CreateJansevakDataSchema),
                data: {
                    user: _user,
                    profile: _profile,
                    avatar: _avatar,
                },
                messages: CreateJansevakDataSchemaMessages,
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages.errors);
        }

        // create new user
        const newJansevakUser = await User.create({
            phoneNumber: validatedData.user.phone_number,
            userType: UserTypes.JANSEVAK,
            isRegistered: true,
            isSetupCompleted: true,
            isVerified: true,
            registeredAt: DateTime.now(),
        });

        // create jansevak profile
        const newJansevakProfile = await newJansevakUser.related("profile").create({
            firstName: validatedData.profile.first_name,
            middleName: validatedData.profile.middle_name,
            lastName: validatedData.profile.last_name,
            gender: validatedData.profile.gender,
            email: validatedData.profile.email,
            birthDate: validatedData.profile.birth_date,
            aadharNumber: validatedData.profile.aadhar_number,
            panNumber: validatedData.profile.pan_number,
            voterIdNumber: validatedData.profile.voter_id_number,
        });

        // create profile avatar
        if (validatedData.avatar) {
            try {
                await validatedData.avatar.moveToDisk("./");
                const avatarAttachment = await Attachment.create({
                    clientName: validatedData.avatar.clientName,
                    fileName: validatedData.avatar.fileName,
                    filePath: validatedData.avatar.filePath,
                    fileType: validatedData.avatar.extname,
                    mimeType: validatedData.avatar.type + "/" + validatedData.avatar.subtype,
                    referenceType: PolymorphicType.Profile,
                    referenceId: newJansevakProfile.id,
                });

                newJansevakProfile.avatar = await Drive.getUrl(avatarAttachment.filePath);
                await newJansevakProfile.save();
            } catch (e) {
                throw new UnknownErrorException(e.message, e.messages);
            }
        }

        // create profile address
        await newJansevakProfile.related("address").create({
            addressLineOne: validatedData.profile.address.address_line_1,
            addressLineTwo: validatedData.profile.address.address_line_2,
            pincode: validatedData.profile.address.pincode,
            district: validatedData.profile.address.district,
            city: validatedData.profile.address.city,
            state: validatedData.profile.address.state,
            country: "IN",
        });

        // create user allocation
        await newJansevakUser.related("allocation").create({
            wardId: await Ward.query().where("code", validatedData.user.ward).firstOrFail().then((ward) => ward.id),
            verifiedBy: user.id,
            createdBy: user.id,
            verification: UserVerificationStatuses.VERIFIED,
            verifiedAt: DateTime.now(),
        });

        return response.status(200).json(Responses.createResponse(newJansevakUser, [ResponseCodes.USER_CREATED], "New Jansevak created"));
    }
}
