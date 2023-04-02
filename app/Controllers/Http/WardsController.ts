import { string } from "@ioc:Adonis/Core/Helpers";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import ValidationException from "App/Exceptions/ValidationException";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import User from "App/Models/User";
import Ward from "App/Models/Ward";
import slugify from "slugify";

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
        // const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        // if (!allows) return Responses.sendUnauthorizedResponse(response);

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
     * @param params
     */
    public async update({ request, auth, bouncer, response, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to update ward
        // const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        // if (!allows) return Responses.sendUnauthorizedResponse(response);

        // get ward name and code from request and params
        const { wardId } = params;
        const { name } = request.only(["name"]);

        // validate data
        let validatedData: { wardId: string; name: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    wardId: schema.string({ trim: true }, [rules.exists({
                        table: "wards",
                        column: "code",
                        where: { deleted_at: null },
                    })]),
                    name: schema.string({ trim: true }, [rules.minLength(3)]),
                }),
                data: { wardId, name },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // check if ward exists
        const ward = await Ward.findByOrFail("code", validatedData.wardId);

        // update ward and return response
        ward.name = validatedData.name;
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
    public async getUsers({ response, auth, bouncer, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to view ward users
        // const allows = await bouncer.forUser(user).with("WardPolicy").allows("canViewWardUsers");
        // if (!allows) return Responses.sendUnauthorizedResponse(response);

        // get ward code from params
        const { wardId } = params;

        // validate data
        let validatedData: { wardId: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    wardId: schema.string({ trim: true }, [rules.exists({
                        table: "wards",
                        column: "code",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { wardId },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // check if ward exists
        const ward = await Ward.findByOrFail("code", validatedData.wardId);

        // get ward users
        const wardUsers = await User.query().whereHas("allocation", (allocation) => {
            allocation.where("ward_id", ward.id);
        }).preload("profile");

        // check if ward users exist
        if (!wardUsers || wardUsers.length < 1) return Responses.sendNotFoundResponse(response, "Ward users not found");

        return response.status(200).send(Responses.createResponse(wardUsers.map((wardUser) => wardUser.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Ward users retrieved"));
    }

    /**
     * Archive ward
     * @param response
     * @param auth
     * @param bouncer
     * @param params
     * @param request
     */
    public async archive({ response, auth, bouncer, params, request }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create ward
        // const allows = await bouncer.forUser(user).with("WardPolicy").allows("canWriteWard");
        // if (!allows) return Responses.sendUnauthorizedResponse(response);

        // check if ward code is provided
        const { wardId } = params;
        const { unarchive } = request.qs();

        // validate data
        let validatedData: { wardId: string; unarchive: boolean | undefined; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    wardId: schema.string({ trim: true }, [rules.exists({
                        table: "wards",
                        column: "code",
                    })]),
                    unarchive: schema.boolean.optional(),
                }),
                data: { wardId, unarchive },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // check if ward exists
        const ward = await Ward.withTrashed().where("code", validatedData.wardId).first();
        if (!ward) return Responses.sendNotFoundResponse(response, "Ward not found");

        // check for unarchive flag
        if (validatedData.unarchive) {
            await ward.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward restored"));
        } else {
            await ward.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Ward archived"));
        }
    }
}
