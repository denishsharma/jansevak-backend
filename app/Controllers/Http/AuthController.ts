import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import User from "App/Models/User";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { getPermissionNames, getPermissionSet } from "App/Helpers/Permissions";
import * as console from "console";
import { DateTime } from "luxon";
import Event from "@ioc:Adonis/Core/Event";
import validator from "validator";
import { getLoggedInUser, UserTypes } from "App/Helpers/Authentication";
import Otp from "App/Models/Otp";

export default class AuthController {
    public async login({ request, bouncer, response, auth }: HttpContextContract) {
        const { phone_number, mode, email, password } = request.only(["phone_number", "mode", "email", "password"]);

        // Check if phone number is provided and mode is empty
        if (!phone_number || phone_number.trim() === "") return Responses.sendInvalidRequestResponse(response, "Phone number not provided");

        // Find user by phone number
        let user: User | null;

        // Check if mode is email and find user by email
        if (mode === "email") {
            // Check if email is provided
            if (!email) return Responses.sendInvalidRequestResponse(response, "Email not provided");
            if (!validator.isEmail(email)) return Responses.sendInvalidRequestResponse(response, "Invalid email");

            // Find user by email
            user = await User.findBy("email", email);
            if (!user) return response.status(400)
                                      .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));

        } else {
            // Check if mode is password and find user by phone number
            if (mode === "password" && !password) return Responses.sendInvalidRequestResponse(response, "Password not provided");

            // Find user by phone number
            user = await User.findBy("phone_number", phone_number);
        }

        let returnResponses: ResponseCodes[] = [];

        // Check if user exists
        // If user does not exist, create a new user
        if (!user && mode === "otp") {
            // Create a new user
            user = await User.create({ phoneNumber: phone_number, userType: UserTypes.NAGRIK });
            user.related("permissions").sync(await getPermissionSet("defaultUser"));
            await user.save();

            returnResponses.push(ResponseCodes.USER_CREATED);

            // Send user created event
            await Event.emit("user:created", { id: user.id, email: user.email, phoneNumber: user.phoneNumber });
        } else if (!user) {
            return response.status(400)
                           .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "Invalid credentials"));
        }

        // Check if user is verified and mode is not empty
        if (user.isRegistered && (mode === "email" || mode === "password")) {
            // Check if password is provided
            if (!password) {
                return response.status(400)
                               .json(Responses.createResponse({}, [ResponseCodes.PASSWORD_NOT_PROVIDED], "Password not provided"));
            }

            // Check if mode is email
            if (mode === "email") {
                // Check if user is allowed to login using email
                const allowLoginUsingEmail = await bouncer.forUser(user).with("AuthPolicy")
                                                          .allows("canLoginUsingEmail");
                if (!allowLoginUsingEmail) {
                    return response.status(400)
                                   .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to login using email"));
                }

                return await this.loginWithPassword(auth, response, user, password);
            }

            // Check if mode is password or mode is email
            if (mode === "email" || mode === "password") {
                // Check if user is allowed to login using password
                const allowLoginUsingPassword = true;
                // await bouncer.forUser(user).with("AuthPolicy").allows("canLoginUsingPassword");
                if (!allowLoginUsingPassword) {
                    return response.status(400)
                                   .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to login using password"));
                }

                return await this.loginWithPassword(auth, response, user, password);
            }
        }

        let _otp: Otp = Otp as any;
        if (mode === "otp") {
            // Generate OTP and send it to the user
            _otp = await user.generateOtp();
        }

        returnResponses.push(ResponseCodes.OTP_SENT);

        return response.status(200).json(Responses.createResponse(
            { user: { id: user.uuid }, otp: _otp.otp }, returnResponses, "OTP sent to your phone number",
        ));
    }

    public async verify({ request, auth, response }: HttpContextContract) {
        const { otp, user_uuid } = request.only(["otp", "user_uuid"]);

        // Check if OTP and user id are provided
        if (!otp || !user_uuid) return Responses.sendInvalidRequestResponse(response, "OTP or user id not provided");

        const user = await User.findBy("uuid", user_uuid);
        if (!user) return response.status(400)
                                  .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));

        // Verify OTP
        const isOtpValid = await user.verifyOtp(otp);
        if (!isOtpValid) return response.status(400)
                                        .json(Responses.createResponse({}, [ResponseCodes.INVALID_OTP], "Invalid OTP"));

        let codes: ResponseCodes[] = [];
        let message = "User verified and logged in successfully";

        console.log(user.isRegistered);

        // Check if user is already registered
        if (!user.isRegistered) {
            // Set user as registered
            await user.merge({
                isRegistered: true,
                registeredAt: DateTime.now(),
                fid: user.fid || String(Math.floor(Math.random() * 1000000000)),
            }).save();

            codes.push(ResponseCodes.USER_VERIFIED);
            codes.push(ResponseCodes.USER_LOGGED_IN);
            message = "User verified and logged in successfully";
        }

        // Generate JWT and send it to the user along with the user id
        const jwt = await user.login(auth);

        if (user.isRegistered) {
            codes.push(ResponseCodes.USER_LOGGED_IN);
            message = "User logged in successfully";
        }

        return response.json(Responses.createResponse(
            { jwt, user: { id: user.uuid, permissions: await getPermissionNames(user) } }, codes, message,
        ));
    }

    public async generateOtp({ request, response }: HttpContextContract) {
        const { user_uuid } = request.only(["user_uuid"]);

        // Check if user uuid is provided
        if (!user_uuid) return Responses.sendInvalidRequestResponse(response, "User id not provided");

        // Check if user exists
        const user = await User.findBy("uuid", user_uuid);
        if (!user) return response.status(400)
                                  .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));

        // Generate OTP and send it to the user
        await user.generateOtp();

        return response.status(200)
                       .json(Responses.createResponse({}, [ResponseCodes.OTP_SENT], "OTP sent to your phone number"));
    }

    public async me({ response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // load user profile
        await user.load("profile", (query) => {
            query.preload("address");
        });

        // load user allocation
        await user.load("allocation", (query) => {
            query.preload("allocatedToUser", (query) => {
                query.preload("profile");
            });
            query.preload("wardUser");
        });

        return response.status(200).send(Responses.createResponse(user.serialize({
            fields: { pick: ["uuid", "fid", "phone_number", "email", "is_setup_completed", "is_verified", "user_type"] },
            relations: {
                profile: {
                    fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] },
                    relations: { address: { fields: { omit: ["deleted_at", "created_at", "updated_at"] } } },
                },
                allocation: {
                    fields: { pick: ["allocatedToUser", "ward"] },
                    relations: {
                        allocatedToUser: {
                            fields: { pick: ["uuid", "fid", "email", "user_type"] },
                            relations: { profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } } },
                        },
                        ward: { fields: { pick: ["name", "code"] } },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Fetched authenticated user data."));
    }

    private async loginWithPassword(auth, response, user: User, password: string) {
        // Generate JWT and send it to the user along with the user id

        // Check if password is valid
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            return response.status(400)
                           .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "Invalid password"));
        }

        // Generate JWT and send it to the user along with the user id
        const jwt = await user.login(auth);

        return response.json(Responses.createResponse(
            { jwt, user: { id: user.uuid, permissions: await getPermissionNames(user) } },
            [ResponseCodes.USER_LOGGED_IN],
            "User logged in successfully",
        ));
    }
}
