import Drive from "@ioc:Adonis/Core/Drive";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import ValidationException from "App/Exceptions/ValidationException";
import { getLoggedInUser, OtpTypes, UserTypes, UserVerificationStatuses, verifyOTP } from "App/Helpers/Authentication";
import { GroupTypes } from "App/Helpers/Groups";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { CreateJansevakDataSchema, CreateJansevakDataSchemaMessages } from "App/Helpers/Validators";
import Attachment from "App/Models/Attachment";
import Group from "App/Models/Group";
import User from "App/Models/User";
import UserAllocation from "App/Models/UserAllocation";
import Ward from "App/Models/Ward";
import CreateNagarikValidator, { CreateNagarikSchema } from "App/Validators/CreateNagarikValidator";
import console from "console";
import { DateTime } from "luxon";

export default class UsersController {
    /**
     * Update user password
     * @param auth
     * @param request
     * @param response
     * @param bouncer
     */
    public async updatePassword({ auth, request, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to update password
        /* Write Logic Here */

        // check if request is valid
        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    password: schema.string({ trim: true }, [rules.minLength(8), rules.maxLength(64), rules.regex(/^((?!.*\s)(?=.*\d).{8,})$/), rules.confirmed()]),
                }),
                data: request.only(["password", "password_confirmation"]),
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // update password
        user.password = validatedData.password;
        await user.save();

        return response.status(200)
                       .json(Responses.createResponse({}, [ResponseCodes.PASSWORD_RESET_DONE], "User password updated"));
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
            return response.status(401)
                           .json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        const { email } = request.only(["email"]);

        if (!email) {
            return response.status(400)
                           .json(Responses.createResponse({}, [ResponseCodes.EMAIL_NOT_PROVIDED], "Email not provided"));
        }

        if (!validator.isEmail(email)) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.BAD_INPUT], "Invalid email"));
        }

        user.email = email;
        await user.save();

        return response.status(200)
                       .json(Responses.createResponse({}, [ResponseCodes.USER_UPDATED], "User email updated"));
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
            allocatedTo: await User.query().where("uuid", validatedData.user.jansevak).firstOrFail()
                                   .then((user) => user.id),
            verifiedBy: user.id,
            createdBy: user.id,
            verification: UserVerificationStatuses.VERIFIED,
            verifiedAt: DateTime.now(),
        });

        return response.status(200)
                       .json(Responses.createResponse(newNagarikUser, [ResponseCodes.USER_CREATED], "New Nagarik created"));
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
                reporter: validator.reporters.jsonapi,
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

        return response.status(200)
                       .json(Responses.createResponse(newJansevakUser, [ResponseCodes.USER_CREATED], "New Jansevak created"));
    }

    public async getJansevaks({ auth, response, request }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // get user data from request
        const { user: _user, ward: _ward } = request.qs();


        let validatedData: { user: string | undefined; ward: string | undefined; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    user: schema.string.optional({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                    ward: schema.string.optional({ trim: true }, [rules.exists({
                        table: "wards",
                        column: "code",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { user: _user, ward: _ward },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // fetch user
        if (validatedData.user) {
            const __user = await User.findBy("uuid", validatedData.user);
            if (__user) user = __user;
        }

        await user.load("allocation", (query) => {
            query.preload("allocatedToUser", (query) => {
                query.preload("profile");
            });
        });

        // check if user is authorized to get jansevaks
        /* Write Logic Here */

        const jansevakObject: any = {};

        if (user?.allocation) {
            // add my jansevak if exists
            if (user.allocation.allocatedToUser) {
                jansevakObject.my_jansevak = user.allocation.allocatedToUser.serialize({
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                });
            }


            // get ward jansevaks
            const wardJansevaks = await UserAllocation.query().where("ward_id", user.allocation.wardId)
                                                      .whereHas("user", (query) => {
                                                          query.where("user_type", UserTypes.JANSEVAK);
                                                      }).preload("user", (query) => {
                    query.preload("profile");
                });

            // filter out my jansevak if exists
            let filteredWardJansevaks = wardJansevaks;
            if (user.allocation.allocatedToUser) {
                filteredWardJansevaks = wardJansevaks.filter((allocation) => allocation.user.id !== user?.allocation.allocatedToUser.id);
            }

            // add ward jansevaks if exists
            if (filteredWardJansevaks.length > 0) {
                jansevakObject.ward_jansevaks = filteredWardJansevaks.map((allocation) => allocation.user.serialize({
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                }));
            }
        }


        // if there is given ward, get given ward jansevaks
        if (validatedData.ward) {
            const givenWard = await Ward.findBy("code", validatedData.ward);
            if (givenWard) {
                const givenWardJansevaks = await UserAllocation.query().where("ward_id", givenWard.id)
                                                               .whereHas("user", (query) => {
                                                                   query.where("user_type", UserTypes.JANSEVAK);
                                                               }).preload("user", (query) => {
                        query.preload("profile");
                    });

                // add given ward jansevaks if exists
                if (givenWardJansevaks.length > 0) {
                    jansevakObject.given_ward_jansevaks = givenWardJansevaks.map((allocation) => allocation.user.serialize({
                        fields: { pick: ["uuid", "user_type", "phone_number"] },
                        relations: {
                            profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                        },
                    }));
                }
            }
        }

        return response.status(200)
                       .json(Responses.createResponse(jansevakObject, [ResponseCodes.SUCCESS_WITH_DATA], "Jansevak fetched"));

    }

    public async getAllNagariks({ auth, response, request }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get all nagariks
        /* Write Logic Here */

        const { only } = request.qs();

        let validatedData: { only: string | undefined; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    only: schema.enum.optional(["verified", "notVerified", "setupCompleted", "notSetupCompleted"]),
                }),
                data: { only },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const allNagariks = await User.query().where("user_type", UserTypes.NAGRIK).if(validatedData.only === "verified", (query) => {
            query.where("is_verified", true);
        }).if(validatedData.only === "notVerified", (query) => {
            query.where("is_verified", false);
        }).if(validatedData.only === "setupCompleted", (query) => {
            query.where("is_setup_completed", true);
        }).if(validatedData.only === "notSetupCompleted", (query) => {
            query.where("is_setup_completed", false);
        }).preload("profile");

        return response.status(200).json(Responses.createResponse(allNagariks.map((user) => user.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "All Nagariks fetched"));
    }

    public async getWardNagariks({ auth, response, params, request }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get ward nagariks
        /* Write Logic Here */

        const { wardId } = params;
        const { only } = request.qs();

        // validate ward id
        let validatedData: { wardId: string };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    wardId: schema.string({ trim: true }, [rules.exists({
                        table: "wards",
                        column: "code",
                        where: { deleted_at: null },
                    })]),
                    only: schema.enum.optional(["verified", "notVerified", "setupCompleted", "notSetupCompleted"]),
                }),
                data: { wardId, only },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const ward = await Ward.findByOrFail("code", validatedData.wardId);

        const wardNagariks = await User.query().where("user_type", UserTypes.NAGRIK).whereHas("allocation", (query) => {
            query.where("ward_id", ward.id);
        }).if(only === "verified", (query) => {
            query.where("is_verified", true);
        }).if(only === "notVerified", (query) => {
            query.where("is_verified", false);
        }).if(only === "setupCompleted", (query) => {
            query.where("is_setup_completed", true);
        }).if(only === "notSetupCompleted", (query) => {
            query.where("is_setup_completed", false);
        }).preload("profile");

        return response.status(200).json(Responses.createResponse(wardNagariks.map((user) => user.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Ward Nagariks fetched"));
    }

    public async getAssignedNagariks({ auth, response, params, request }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get assigned nagariks
        /* Write Logic Here */

        const { assignedToId } = params;
        const { only } = request.qs();

        // validate assigned to id
        let validatedData: { assignedToId: string };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    assignedToId: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                    only: schema.enum.optional(["verified", "notVerified", "setupCompleted", "notSetupCompleted"]),
                }),
                data: { assignedToId, only },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const assignedTo = await User.findByOrFail("uuid", validatedData.assignedToId);

        const assignedNagariks = await User.query().where("user_type", UserTypes.NAGRIK).whereHas("allocation", (query) => {
            query.where("allocated_to", assignedTo.id);
        }).if(only === "verified", (query) => {
            query.where("is_verified", true);
        }).if(only === "notVerified", (query) => {
            query.where("is_verified", false);
        }).if(only === "setupCompleted", (query) => {
            query.where("is_setup_completed", true);
        }).if(only === "notSetupCompleted", (query) => {
            query.where("is_setup_completed", false);
        }).preload("profile");

        return response.status(200).json(Responses.createResponse(assignedNagariks.map((user) => user.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Assigned Nagariks fetched"));
    }

    public async getAllJansevaks({ auth, response }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get all jansevaks
        /* Write Logic Here */

        const jansevaks = await User.query().where("user_type", UserTypes.JANSEVAK).preload("profile");

        return response.status(200).json(Responses.createResponse(jansevaks.map((user) => user.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "All Jansevaks fetched"));
    }

    public async getWardJansevaks({ auth, response, params }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get ward jansevaks
        /* Write Logic Here */

        const { wardId } = params;

        // validate ward id
        let validatedData: { wardId: string };
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

        const ward = await Ward.findByOrFail("code", validatedData.wardId);

        const wardJansevaks = await User.query().where("user_type", UserTypes.JANSEVAK).whereHas("allocation", (query) => {
            query.where("ward_id", ward.id);
        }).preload("profile");

        return response.status(200).json(Responses.createResponse(wardJansevaks.map((user) => user.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Ward Jansevaks fetched"));
    }

    public async getAssignedJansevak({ auth, response, params }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get assigned jansevak
        /* Write Logic Here */

        const { assignedToId } = params;

        // validate assigned to id
        let validatedData: { assignedToId: string };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    assignedToId: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { assignedToId },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const assignedTo = await User.findByOrFail("uuid", validatedData.assignedToId);
        await assignedTo.load("allocation", (query) => {
            query.preload("allocatedToUser", (query) => {
                query.preload("profile");
            });
        });

        // get assigned jansevak for the user assigned to
        const assignedJansevak = assignedTo.allocation?.allocatedToUser;

        if (!assignedJansevak) return response.status(200).json(Responses.createResponse(null, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Assigned Jansevak not found"));

        return response.status(200).json(Responses.createResponse(assignedJansevak.serialize({
            fields: { pick: ["uuid", "fid", "user_type", "phone_number", "is_setup_completed", "is_verified", "is_archived"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Assigned Jansevak fetched"));
    }

    public async getUserByFid({ auth, response, params, request }: HttpContextContract) {
        // check if user is authenticated
        let user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get user by fid
        /* Write Logic Here */

        const { get } = request.qs();

        let validatedData: { fid: string; get: "all" | "my_nagarik" | "family"; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    fid: schema.string({ trim: true }, [rules.exists({
                        table: "users",
                        column: "fid",
                        where: { deleted_at: null },
                        whereNot: { fid: user.fid },
                    })]),
                    get: schema.enum(["all", "my_nagarik", "family"] as const),
                }),
                data: { fid: params.fid, get },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // fetch user
        let __user;

        if (validatedData.get === "all") {
            __user = await User.query().where("fid", validatedData.fid).first();
        } else if (validatedData.get === "my_nagarik") {
            const _allocation = await UserAllocation.query().where("allocated_to", user.id)
                                                    .orWhere("verified_by", user.id).preload("user");
            __user = _allocation.map((allocation) => allocation.user).find((user) => user.fid === validatedData.fid);
        } else if (validatedData.get === "family") {
            let familyGroup: Group;

            await user.load("groups", (query) => {
                query.where("type", GroupTypes.FAMILY);
            });

            if (user.groups.length > 0) {
                familyGroup = user.groups[0];
            } else {
                await user.load("familyGroup");
                familyGroup = user.familyGroup;
            }

            if (familyGroup) {
                await familyGroup.load("users", (query) => {
                    query.where("fid", validatedData.fid);
                });
                __user = familyGroup.users[0];
            }
        }

        if (!__user) return Responses.sendNotFoundResponse(response, "User not found");

        await __user.load("profile");

        return response.status(200).json(Responses.createResponse(__user.serialize({
            fields: { pick: ["uuid", "user_type", "phone_number"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "User fetched"));
    }
}
