import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { generateRSASignature, getLoggedInUser, OtpTypes } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import User from "App/Models/User";
import { DateTime } from "luxon";
import Otp from "App/Models/Otp";
import Event from "@ioc:Adonis/Core/Event";

export default class CertsController {
    public async newNagarik({ request, response, auth }: HttpContextContract) {
        const { requested_for: requestedFor, payload } = request.only(["requested_for", "payload"]);

        if (!requestedFor || !requestedFor.trim()) return Responses.sendInvalidRequestResponse(response, "Requested for is required. It should be phone number.");
        if (!payload) return Responses.sendInvalidRequestResponse(response, "Payload is required");

        return await this.generateOTP(request, response, auth, OtpTypes.SERVICE_NEW_NAGARIK, payload);
    }

    private async generateOTP(request: HttpContextContract["request"], response: HttpContextContract["response"], auth: HttpContextContract["auth"], service: OtpTypes, servicePayload: any = {}) {
        const hasAuthorizationHeader = !!request.header("authorization");

        let {
            requested_by: requestedBy,
            requested_for: requestedFor,
        } = request.only(["requested_by", "requested_for"]);

        if (!requestedFor || !requestedFor.trim()) requestedFor = requestedBy;

        if (hasAuthorizationHeader) {
            const user = await getLoggedInUser(auth);
            if (!user) return Responses.sendUnauthenticatedResponse(response);

            // set requested by to the logged-in user
            requestedBy = user.uuid;

            let requestedForUser = null as User | null;

            if (requestedFor !== requestedBy) {
                const _forUser = await User.findBy("uuid", requestedFor);
                if (_forUser) requestedForUser = _forUser;
            } else if (requestedFor === requestedBy) requestedForUser = user;

            if (!OtpTypes[service]) return Responses.sendInvalidRequestResponse(response, "Invalid service");

            const payload = {
                requestedBy,
                requestedFor,
                seed: DateTime.now().toUnixInteger(),
                service: servicePayload,
            };

            const otp = await Otp.create({
                type: service,
                otp: Math.floor(100000 + Math.random() * 900000).toString(),
                phoneNumber: requestedForUser?.phoneNumber || requestedFor || "",
                userId: user?.id,
                payload: JSON.stringify(payload),
                expiresAt: DateTime.now().plus({ minutes: 5 }),
            });

            await Event.emit("otp:generated", {
                user: { id: requestedBy ?? user?.id, phoneNumber: requestedForUser?.phoneNumber || requestedFor || "" },
                otp: otp.otp,
                expiresAt: otp.expiresAt.toString(),
            });

            return response.status(200).json(Responses.createResponse(
                { sig: generateRSASignature(Buffer.from(JSON.stringify(payload)).toString("base64")) },
                [ResponseCodes.OTP_SENT], "OTP sent to the phone number",
            ));
        } else {
            if (!requestedBy || !requestedBy.trim()) return Responses.sendInvalidRequestResponse(response, "Requested by not provided");
            if (![OtpTypes.AUTH].includes(service)) return Responses.sendInvalidRequestResponse(response, "Invalid service");

            let phoneNumber = null as string | null;
            const user = await User.findBy("uuid", requestedBy);
            if (!user) phoneNumber = requestedBy;

            requestedFor = requestedBy || phoneNumber || "";

            const payload = {
                requestedBy,
                requestedFor,
                seed: DateTime.now().toUnixInteger(),
                service: servicePayload,
            };

            const otp = await Otp.create({
                type: service,
                otp: Math.floor(100000 + Math.random() * 900000).toString(),
                phoneNumber: phoneNumber || user?.phoneNumber || "",
                userId: user?.id,
                payload: JSON.stringify(payload),
                expiresAt: DateTime.now().plus({ minutes: 5 }),
            });

            await Event.emit("otp:generated", {
                user: { id: requestedBy ?? user?.id, phoneNumber: phoneNumber || user?.phoneNumber || "" },
                otp: otp.otp,
                expiresAt: otp.expiresAt.toString(),
            });

            return response.status(200).json(Responses.createResponse(
                { sig: generateRSASignature(Buffer.from(JSON.stringify(payload)).toString("base64")) },
                [ResponseCodes.OTP_SENT], "OTP sent to the phone number",
            ));
        }
    }
}
