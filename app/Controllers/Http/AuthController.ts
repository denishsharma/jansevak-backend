import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import User from "App/Models/User";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { getPermissionNames, getPermissionSet } from "App/Helpers/Permissions";
import * as console from "console";
import { DateTime } from "luxon";
import Hash from "@ioc:Adonis/Core/Hash";
import Event from "@ioc:Adonis/Core/Event";
import validator from "validator";

export default class AuthController {

    public async login({ request, bouncer, response, auth }: HttpContextContract) {
        const { phone_number, mode, email, password } = request.only(["phone_number", "mode", "email", "password"]);

        // Check if phone number is provided and mode is empty
        if (!phone_number && !mode) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PHONE_NUMBER_NOT_PROVIDED], "Phone number not provided"));
        }

        // Find user by phone number
        let user = await User.findBy("phone_number", phone_number);

        // Check if mode is email and find user by email
        if (mode === "email") {
            // Check if email is provided
            if (!email) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.EMAIL_NOT_PROVIDED], "Email not provided"));
            }

            // Check if email is valid
            if (!validator.isEmail(email)) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.BAD_INPUT], "Invalid email"));
            }

            // Find user by email
            user = await User.findBy("email", email);
        }

        // Check if user exists
        // If user does not exist, create a new user
        if (!user) {
            // Create a new user
            user = await User.create({ phoneNumber: phone_number });
            user.related("permissions").sync(await getPermissionSet("defaultUser"));
            await user.save();

            // Send user created event
            await Event.emit("user:created", { id: user.id, email: user.email, phoneNumber: user.phoneNumber });
        }

        // Check if user is verified and mode is not empty
        if (user.isRegistered && mode) {
            // Check if password is provided
            if (!password) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PASSWORD_NOT_PROVIDED], "Password not provided"));
            }

            // Check if mode is email
            if (mode === "email") {
                // Check if user is allowed to login using email
                const allowLoginUsingEmail = await bouncer.forUser(user).with("AuthPolicy").allows("canLoginUsingEmail");
                if (!allowLoginUsingEmail) {
                    return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to login using email"));
                }

                return await this.loginWithPassword(auth, response, user, password);
            }

            // Check if mode is password or mode is email
            if (mode === "email" || mode === "password") {
                // Check if user is allowed to login using password
                const allowLoginUsingPassword = await bouncer.forUser(user).with("AuthPolicy").allows("canLoginUsingPassword");
                if (!allowLoginUsingPassword) {
                    return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to login using password"));
                }

                return await this.loginWithPassword(auth, response, user, password);
            }
        }

        // Generate OTP and send it to the user
        await user.generateOtp();

        return response.status(200).json(Responses.createResponse(
            {
                user: { id: user.uuid },
            },
            [ResponseCodes.OTP_SENT, ResponseCodes.USER_CREATED],
            "OTP sent to your phone number",
        ));
    }

    public async verify({ request, auth, response }: HttpContextContract) {
        const { otp, user_uuid } = request.only(["otp", "user_uuid"]);

        // Check if OTP and user id are provided
        if (!otp || !user_uuid) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "OTP or user UUID not provided"));
        }

        const user = await User.findBy("uuid", user_uuid);

        // Check if user exists
        if (!user) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));
        }

        // Verify OTP
        const isOtpValid = await user.verifyOtp(otp);

        // Check if OTP is valid
        if (!isOtpValid) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_OTP], "Invalid OTP"));
        }

        let codes: ResponseCodes[] = [];
        let message = "User verified and logged in successfully";

        console.log(user.isRegistered);

        // Check if user is already registered
        if (!user.isRegistered) {
            // Set user as registered
            await user.merge({
                isRegistered: true,
                registeredAt: DateTime.now(),
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
        if (!user_uuid) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "User UUID not provided"));
        }

        const user = await User.findBy("uuid", user_uuid);

        // Check if user exists
        if (!user) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "User not found"));
        }

        // Generate OTP and send it to the user
        await user.generateOtp();

        return response.status(200).json(Responses.createResponse({}, [ResponseCodes.OTP_SENT], "OTP sent to your phone number"));
    }

    private async loginWithPassword(auth, response, user: User, password: string) {
        // Generate JWT and send it to the user along with the user id

        // Check if password is valid
        const isPasswordValid = await Hash.verify(user.password, password);
        if (!isPasswordValid) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "Invalid password"));
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
