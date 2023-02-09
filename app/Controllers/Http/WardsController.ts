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
        const wards = await Ward.all();

        if (wards && wards.length > 0) {
            return response.status(200).send(Responses.createResponse(wards, [ResponseCodes.SUCCESS_WITH_DATA], "Wards found"));
        }

        return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Wards not found"));
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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to create ward
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canCreateWard");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get ward name from request
        const { name } = request.only(["name"]);

        // check if ward name is provided
        if (!name) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // create ward and return response
        const ward = await Ward.create({
            name,
            code: slugify(`${name} ${string.generateRandom(4)}`, { lower: true, strict: true }),
        });

        return response.status(201).send(Responses.createResponse(ward, [ResponseCodes.SUCCESS_WITH_DATA], "Ward created"));
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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if ward code is provided
        const { ward_code } = request.only(["ward_code"]);

        if (!ward_code) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // check if ward exists
        const ward = await Ward.findBy("code", ward_code);

        if (!ward) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Ward not found"));
        }

        // check if user is authorized to view ward users
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canViewWardUsers");
        if (!allows) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized to view ward users"));
        }

        // load ward users
        await ward.load("users");
        return response.status(200).send(Responses.createResponse(ward, [ResponseCodes.SUCCESS_WITH_DATA], "Ward users found"));
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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to archive ward
        const allows = await bouncer.forUser(user).with("WardPolicy").allows("canArchiveWard");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // check if ward code is provided
        const { ward_code, is_archived } = request.only(["ward_code", "is_archived"]);

        if (!ward_code || is_archived === undefined) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // check if ward exists
        const ward = await Ward.withTrashed().where("code", ward_code).first();

        if (!ward) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Ward not found"));
        }

        // update ward
        const wardIsAlreadyArchived = ward.deletedAt !== null;
        if (is_archived && !wardIsAlreadyArchived) {
            await ward.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward archived"));
        } else if (!is_archived && wardIsAlreadyArchived) {
            await ward.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward restored"));
        }
    }
}
