import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import console from "console";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import ValidationException from "App/Exceptions/ValidationException";
import { UpdateProfileDataInterface, UpdateProfileDataSchema } from "App/Helpers/Validators";
import User from "App/Models/User";

export default class ProfilesController {
    public async updateProfile({ auth, request, response, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create new nagarik
        /* Write Logic Here */

        const { id: user_id } = params;

        if (!user_id) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "User ID not provided"));
        }

        // get required data
        const { user: _userRaw, profile: _profileRaw } = request.only(["user", "profile"]);
        console.log(_userRaw, _profileRaw);
        const [_user, _profile] = [_userRaw, _profileRaw].map((raw) => JSON.parse(raw));
        const _avatar = request.file("avatar");

        // validate request with validator and schema
        let validatedData: UpdateProfileDataInterface;
        try {
            validatedData = await validator.validate({
                schema: schema.create(UpdateProfileDataSchema),
                data: {
                    user: _user,
                    profile: _profile,
                    avatar: _avatar,
                },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        console.log(validatedData);
    }

    public async showProfile({ response, auth, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        const { id: user_id } = params;

        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    user_id: schema.string.optional({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                    })]),
                }),
                data: { user_id },
                messages: {
                    required: "User ID is required",
                    "user_id.uuid": "User ID is not a valid UUID",
                    "user_id.exists": "User ID does not exist",
                },
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const _userToFetch = validatedData.user_id || user.uuid;
        let _user = user;

        if (_userToFetch !== user.uuid) {
            // check if user is authorized to fetch profile of other user
            /* Write Logic Here */

            const __user = await User.query().where("uuid", _userToFetch).first();
            if (!__user) return Responses.sendNotFoundResponse(response);
            _user = __user;
        }

        // fetch user's allocation
        await _user.load("allocation", (query) => {
            query.preload("allocatedToUser", (query) => {
                query.preload("profile");
            });
        });

        // fetch user's profile
        await _user.load("profile", (query) => {
            query.preload("address");
        });

        return response.status(200).json(Responses.createResponse(_user.serialize({
            fields: { omit: ["deleted_at", "updated_at", "email_verified_at"] },
            relations: {
                allocation: {
                    fields: { omit: ["deleted_at", "created_at", "updated_at"] },
                    relations: {
                        allocatedToUser: {
                            fields: { pick: ["uuid", "fid", "user_type"] },
                            relations: {
                                profile: {
                                    fields: { pick: ["first_name", "middle_name", "last_name", "gender", "email", "full_name", "avatar_url", "initials_and_last_name"] },
                                },
                            },
                        },
                    },
                },
                profile: {
                    fields: { omit: ["deleted_at", "created_at", "updated_at"] },
                    relations: {
                        address: {
                            fields: { omit: ["deleted_at", "created_at", "updated_at"] },
                        },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Profile fetched successfully"));
    }
}
