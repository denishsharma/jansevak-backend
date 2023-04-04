import Drive from "@ioc:Adonis/Core/Drive";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import ValidationException from "App/Exceptions/ValidationException";
import { getLoggedInUser, UserTypes } from "App/Helpers/Authentication";
import { getAverageRatingForUser } from "App/Helpers/Feedbacks";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import { QueryStatuses } from "App/Helpers/Queries";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { ProfileDataSchema, UpdateProfileDataInterface, UpdateProfileDataSchema } from "App/Helpers/Validators";
import Attachment from "App/Models/Attachment";
import Profile from "App/Models/Profile";
import User from "App/Models/User";
import UserAllocation from "App/Models/UserAllocation";
import UserQuery from "App/Models/UserQuery";
import Ward from "App/Models/Ward";

export default class ProfilesController {
    public async updateProfile({ auth, request, response, params }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create new nagarik
        /* Write Logic Here */

        const { id: user_id } = params;

        if (!user_id) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "User ID not provided"));
        }

        // get required data
        const { user: _userRaw, profile: _profileRaw } = request.only(["user", "profile"]);
        const [_user, _profile] = [_userRaw, _profileRaw].map((raw) => raw ? JSON.parse(raw) : {});
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

        // get user to update
        const _userToUpdate = await User.query().where("uuid", user_id).first();
        if (_userToUpdate) user = _userToUpdate;

        // update user profile data
        const _profileData = {
            firstName: validatedData.profile.first_name,
            lastName: validatedData.profile.last_name,
            aadharNumber: validatedData.profile.aadhar_number,
            voterIdNumber: validatedData.profile.voter_id_number,
            gender: validatedData.profile.gender,
            email: validatedData.profile.email,
            birthDate: validatedData.profile.birth_date,
        };

        // get user profile
        const profile = await user.related("profile").query().preload("address").first();
        if (!profile) return Responses.sendNotFoundResponse(response, "Profile not found");

        if (profile) {
            profile.merge(_profileData);
            await profile.save();
        }

        // update profile address if provided
        if (validatedData.profile.address) {
            const _addressData = {
                addressLineOne: validatedData.profile.address.address_line_1,
                addressLineTwo: validatedData.profile.address.address_line_2,
                district: validatedData.profile.address.district,
                state: validatedData.profile.address.state,
                city: validatedData.profile.address.city,
                pincode: validatedData.profile.address.pincode,
            };

            if (profile.address) {
                profile.address.merge(_addressData);
                await profile.address.save();
            }
        }

        // check if avatar is provided
        if (validatedData.avatar) {
            await this.updateProfileAvatar(profile, { avatar: validatedData.avatar });
        }

        // get user allocation
        const allocation = await user.related("allocation").query().first();

        // update user allocation data
        if (validatedData.user && allocation) {
            // update user ward
            if (validatedData.user.ward) {
                const ward = await Ward.query().where("code", validatedData.user.ward).first();
                if (ward) {
                    allocation.wardId = ward.id;
                    await allocation.save();
                }
            }

            // update jansevak
            if (validatedData.user.jansevak) {
                const jansevak = await User.query().where("uuid", validatedData.user.jansevak).first();
                if (jansevak) {
                    allocation.allocatedTo = jansevak.id;
                    await allocation.save();
                }
            }
        }

        // load profile and allocation with jansevak and ward
        await user.load("profile", (query) => {
            query.preload("address");
        });
        await user.load("allocation", (query) => {
            query.preload("wardUser").preload("allocatedToUser");
        });

        return response.status(200).json(Responses.createResponse(user.serialize({
            fields: { omit: ["deleted_at", "updated_at", "email_verified_at"] },
            relations: {
                allocation: {
                    fields: { omit: ["deleted_at", "created_at", "updated_at"] },
                    relations: {
                        ward: {
                            fields: { omit: ["deleted_at", "created_at", "updated_at"] },
                        },
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
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Profile updated successfully"));
    }

    public async setupProfile({ auth, request, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to setup profile
        /* Write Logic Here */

        // get required data
        const { user: _userRaw, profile: _profileRaw } = request.only(["user", "profile"]);
        const [_user, _profile] = [_userRaw, _profileRaw].map((raw) => JSON.parse(raw));
        const _avatar = request.file("avatar");

        // validate request with validator and schema
        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    user: schema.object().members({
                        ward: schema.string({}, [rules.exists({ table: "wards", column: "code" })]),
                        jansevak: schema.string({}, [rules.exists({
                            table: "users",
                            column: "uuid",
                            where: { user_type: [UserTypes.JANSEVAK, UserTypes.ADMIN] },
                        })]),
                    }),
                    profile: schema.object().members(ProfileDataSchema),
                    avatar: schema.file.optional({ size: "2mb", extnames: ["jpg", "png", "jpeg"] }),
                }),
                data: {
                    user: _user,
                    profile: _profile,
                    avatar: _avatar,
                },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get user profile
        const profile = await user.related("profile").query().preload("address").first();
        if (!profile) return Responses.sendNotFoundResponse(response, "Profile not found");

        await this.updateProfileData(profile, {
            firstName: validatedData.profile.first_name,
            lastName: validatedData.profile.last_name,
            aadharNumber: validatedData.profile.aadhar_number,
            voterIdNumber: validatedData.profile.voter_id_number,
            gender: validatedData.profile.gender,
            email: validatedData.profile.email,
            birthDate: validatedData.profile.birth_date,
        });

        // update profile address
        profile.address.merge({ country: "IN" });
        await this.updateProfileAddress(profile, {
            addressLineOne: validatedData.profile.address.address_line_1,
            addressLineTwo: validatedData.profile.address.address_line_2,
            district: validatedData.profile.address.district,
            state: validatedData.profile.address.state,
            city: validatedData.profile.address.city,
            pincode: validatedData.profile.address.pincode,
        });

        // update avatar if provided
        if (validatedData.avatar) {
            await this.updateProfileAvatar(profile, { avatar: validatedData.avatar });
        }

        // create user allocation
        const ward = await Ward.query().where("code", validatedData.user.ward).first();
        const jansevak = await User.query().where("uuid", validatedData.user.jansevak).first();
        if (ward && jansevak) {
            await user.related("allocation").create({
                wardId: ward.id,
                allocatedTo: jansevak.id,
                createdBy: user.id,
            });
        }

        // update profile setup status
        user.isSetupCompleted = true;
        await user.save();
        await profile.save();

        return response.status(200).json(Responses.createResponse(validatedData, [], "Profile setup completed"));
    }

    public async getProfileSummary({ auth, response, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get profile summary
        /* Write Logic Here */

        // validate request with validator and schema
        let validatedData: { user_id: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    user_id: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { user_id: params.id },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get user to get profile summary
        const userToGetProfileSummary = await User.query().where("uuid", validatedData.user_id).preload("profile", (query) => {
            query.preload("address");
        }).preload("allocation", (query) => {
            query.preload("wardUser");
            query.preload("allocatedToUser", (query) => {
                query.preload("profile");
            });
        }).first();
        if (!userToGetProfileSummary) return Responses.sendNotFoundResponse(response, "User not found");

        const summaryStats = {
            rating: 0,
            nagarik: 0,
            queries: 0,
            pending: 0,
            resolved: 0,
            inProgress: 0,
        };

        // get queries assigned to user to get profile summary
        const queriesAssigned = await UserQuery.query().where("for_jansevak", userToGetProfileSummary.id).orWhere("created_by", userToGetProfileSummary.id).orWhere("on_behalf_of", userToGetProfileSummary.id).preload("query");

        // check if user to get profile summary is Jansevak or Admin
        if (userToGetProfileSummary.userType === UserTypes.JANSEVAK || userToGetProfileSummary.userType === UserTypes.ADMIN) {
            // get user allocations
            const nagarikOnboarded = await UserAllocation.query().where("allocated_to", userToGetProfileSummary.id).orWhere("created_by", userToGetProfileSummary.id);

            summaryStats.nagarik = nagarikOnboarded.length;
        }

        // get resolved queries and pending queries (which are not resolved or rejected) and queries in progress
        const resolvedQueries = queriesAssigned.filter((query) => query.query.status === QueryStatuses.RESOLVED);
        const pendingQueries = queriesAssigned.filter((query) => query.query.status !== QueryStatuses.RESOLVED && query.query.status !== QueryStatuses.REJECTED);
        const inProgressQueries = queriesAssigned.filter((query) => query.query.status === QueryStatuses.IN_PROGRESS);

        summaryStats.queries = queriesAssigned.length;
        summaryStats.resolved = resolvedQueries.length;
        summaryStats.pending = pendingQueries.length;
        summaryStats.inProgress = inProgressQueries.length;

        summaryStats.rating = await getAverageRatingForUser(userToGetProfileSummary);

        return response.status(200).json(Responses.createResponse({
            user: userToGetProfileSummary.serialize({
                fields: {
                    omit: ["email", "deleted_at", "updated_at", "is_registered", "email_verified_at", "last_login_at"],
                },
                relations: {
                    profile: {
                        fields: {
                            omit: ["deleted_at", "created_at", "updated_at"],
                        },
                        relations: {
                            address: {
                                fields: {
                                    omit: ["deleted_at", "created_at", "updated_at"],
                                },
                            },
                        },
                    },
                    allocation: {
                        fields: {
                            pick: ["verification", "verified_at", "ward"],
                        },
                        relations: {
                            ward: {
                                fields: {
                                    pick: ["code", "name"],
                                },
                            },
                            allocatedToUser: {
                                fields: {
                                    pick: ["uuid", "phone_number", "user_type"],
                                },
                                relations: {
                                    profile: {
                                        fields: {
                                            pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            stats: summaryStats,
        }, [], "Profile summary fetched successfully"));
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
                reporter: validator.reporters.jsonapi,
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

    private async updateProfileData(profile: Profile, validatedData: Partial<{
        firstName,
        lastName,
        aadharNumber,
        voterIdNumber,
        gender,
        email,
        birthDate
    }>) {
        profile.merge(validatedData);
        await profile.save();
    }

    private async updateProfileAddress(profile: Profile, validatedData: Partial<{
        addressLineOne,
        addressLineTwo,
        district,
        city,
        state,
        pincode
    }>) {
        if (profile.address) {
            profile.address.merge(validatedData);
            await profile.address.save();
        }
    }

    private async updateProfileAvatar(profile: Profile, validatedData: Partial<{ avatar }>) {
        if (validatedData.avatar) {
            // get previous avatar if exists
            const previousAvatar = await profile.getAvatarAttachment();
            if (previousAvatar) {
                // delete previous avatar and file
                if (await Drive.exists(previousAvatar.fileName)) await Drive.delete(previousAvatar.fileName);
                await previousAvatar.forceDelete();
            }

            // save new avatar
            try {
                await validatedData.avatar.moveToDisk("./");
                const avatarAttachment = await Attachment.create({
                    clientName: validatedData.avatar.clientName,
                    fileName: validatedData.avatar.fileName,
                    filePath: validatedData.avatar.filePath,
                    fileType: validatedData.avatar.extname,
                    mimeType: validatedData.avatar.type + "/" + validatedData.avatar.subtype,
                    referenceType: PolymorphicType.Profile,
                    referenceId: profile.id,
                });

                profile.avatar = await avatarAttachment.getURL();
                await profile.save();
            } catch (e) {
                throw new UnknownErrorException(e.message, e.messages);
            }
        }
    }
}
