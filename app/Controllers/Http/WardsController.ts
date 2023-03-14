import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Ward from "App/Models/Ward";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import slugify from "slugify";
import { string } from "@ioc:Adonis/Core/Helpers";
import { getLoggedInUser } from "App/Helpers/Authentication";

export default class WardsController {
    /**
     * Get all wards
     * @param response
     */
    public async index({ response }: HttpContextContract) {
        const wards = await Ward.query().select("name", "code");

        // check if wards exist
        if (!wards || wards.length < 1) return Responses.sendNotFoundResponse(response, "Wards not found");

        return response.status(200).send(Responses.createResponse(wards, [ResponseCodes.SUCCESS_WITH_DATA], "Wards found"));
    }

    /**
     * Create ward
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async create({ request, auth, bouncer, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create ward
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        // get ward name from request
        const { name } = request.only(["name"]);

        // check if ward name is provided
        if (!name) return Responses.sendInvalidRequestResponse(response, "Ward name is required");

        // create ward and return response
        const ward = await Ward.create({
            name,
            code: slugify(`${name} ${string.generateRandom(4)}`, { lower: true, strict: true }),
        });

        return response.status(201).send(Responses.createResponse(ward.serialize({
            fields: { pick: ["name", "code"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Ward created"));
    }

    /**
     * Update ward
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async update({ request, auth, bouncer, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to update ward
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        // get ward name and code from request
        const { name, code } = request.only(["name", "code"]);

        // check if ward name and code is provided
        if (!name || !code) return Responses.sendInvalidRequestResponse(response, "Ward name and code is required");

        // check if ward exists
        const ward = await Ward.findBy("code", code);

        // check if ward exists
        if (!ward) return Responses.sendNotFoundResponse(response, "Ward not found");

        // update ward and return response
        ward.name = name;
        await ward.save();

        return response.status(200).send(Responses.createResponse(ward.serialize({
            fields: { pick: ["name", "code"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Ward updated"));
    }

    /**
     * Get ward users
     * @param response
     * @param auth
     * @param bouncer
     * @param request
     */
    public async getUsers({ response, auth, bouncer, request }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to view ward users
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canViewWardUsers");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        // check if ward code is provided
        const { ward_code } = request.only(["ward_code"]);
        if (!ward_code) return Responses.sendInvalidRequestResponse(response, "Ward code is required");

        // check if ward exists
        const ward = await Ward.findBy("code", ward_code);
        if (!ward) return Responses.sendNotFoundResponse(response, "Ward not found");

        // load ward users
        await ward.load("users", (userQuery) => {
            userQuery.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(ward.serialize({
            fields: { pick: ["name", "code"] },
            relations: {
                users: {
                    fields: { pick: ["uuid", "phone_number"] },
                    relations: { profile: { fields: ["avatar_url", "first_name", "middle_name", "last_name", "email", "full_name", "initials_and_last_name"] } },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Ward users found"));
    }

    /**
     * Archive ward
     * @param response
     * @param auth
     * @param bouncer
     * @param request
     */
    public async archive({ response, auth, bouncer, request }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create ward
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        // check if ward code is provided
        const { ward_code } = request.only(["ward_code"]);
        const { unarchive } = request.qs();

        // check if ward code is provided
        if (!ward_code || !ward_code.trim()) return Responses.sendInvalidRequestResponse(response, "Ward code is required");

        // check if ward exists
        const ward = await Ward.withTrashed().where("code", ward_code).first();
        if (!ward) return Responses.sendNotFoundResponse(response, "Ward not found");

        // check for unarchive flag
        if (unarchive) {
            await ward.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward restored"));
        } else {
            await ward.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward archived"));
        }
    }
}
