import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import QueryCategory from "App/Models/QueryCategory";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { getLoggedInUser, UserTypes } from "App/Helpers/Authentication";
import { DateTime } from "luxon";
import { QueryCommentTypes, QueryStatuses, QueryStatusesValues } from "App/Helpers/Queries";
import Query from "App/Models/Query";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import { schema, validator } from "@ioc:Adonis/Core/Validator";
import ValidationException from "App/Exceptions/ValidationException";
import CreateQueryValidator, { CreateQuerySchema } from "App/Validators/CreateQueryValidator";
import User from "App/Models/User";
import { rules } from "@adonisjs/validator/build/src/Rules";
import Group from "App/Models/Group";
import { GroupTypes } from "App/Helpers/Groups";
import QueryComment from "App/Models/QueryComment";
import console from "console";

export default class QueriesController {

    /**
     * Get all query categories
     * @param request
     * @param response
     */
    public async listCategories({ request, response }: HttpContextContract) {
        const { withArchived } = request.qs();
        const categories = await QueryCategory.query().where((query) => {
            if (!withArchived) {
                query.whereNull("archive_at");
            }
        });
        return response.status(200).send(Responses.createResponse(categories, [ResponseCodes.SUCCESS_WITH_DATA], "Categories fetched successfully"));
    }

    /**
     * Create query category
     * @param request
     * @param response
     * @param auth
     */
    public async createCategory({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);


        // check if user is authorized to create query category
        /* Write logic */

        // get category name and description from request
        const { name, description } = request.only(["name", "description"]);

        // check if category name is provided
        if (!name) {
            return Responses.sendInvalidRequestResponse(response, "Category name is required");
        }

        // create category and return response
        const category = await QueryCategory.create({ name, description });

        return response.status(201).send(Responses.createResponse(category.serialize({
            fields: { pick: ["name", "description"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Category created"));
    }

    /**
     * Archive query category
     * @param request
     * @param response
     * @param auth
     */
    public async archiveCategory({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to archive query category
        /* Write logic */

        // get category id from request
        const { id } = request.only(["id"]);
        const { unarchive } = request.qs();

        // check if category id is provided
        if (!id) {
            return Responses.sendInvalidRequestResponse(response, "Category id is required");
        }

        // get category
        const category = await QueryCategory.findBy("uuid", id);

        // check if category exists
        if (!category) {
            return Responses.sendNotFoundResponse(response, "Category not found");
        }

        if (unarchive) {
            category.archiveAt = null;
            await category.save();

            return response.status(200).send(Responses.createResponse(category.serialize({
                fields: { pick: ["name", "description"] },
            }), [ResponseCodes.SUCCESS_WITH_DATA], "Category unarchived"));
        }

        // archive category
        category.archiveAt = DateTime.now();
        await category.save();

        return response.status(200).send(Responses.createResponse(category.serialize({
            fields: { pick: ["name", "description"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Category archived"));
    }

    public async createQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create query
        /* Write logic */

        // get query form data, relation and attachments from request
        const { form: _formRaw, relation: _relationRaw } = request.only(["form", "relation"]);
        const [_form, _relation] = [_formRaw, _relationRaw].map((data) => JSON.parse(data));
        const _attachments = request.files("attachments");

        let validatedData: CreateQuerySchema;
        try {
            validatedData = await validator.validate({
                schema: CreateQueryValidator.schema,
                data: {
                    form: _form,
                    relation: _relation,
                    attachments: _attachments,
                },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query category
        const queryCategory = await QueryCategory.findBy("uuid", validatedData.form.category);

        // create new query
        const query = await queryCategory?.related("queries").create({
            subject: validatedData.form.subject,
            description: validatedData.form.description,
        });

        // create log comment
        await query?.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            status: QueryStatuses.CREATED,
        });

        await query?.load("queryCategory");
        await query?.load("queryComments", (query) => {
            query.preload("user");
        });

        // handle query relation
        await query?.related("userRelation").create({
            onBehalfOf: await User.query().where("uuid", validatedData.relation.on_behalf_of).firstOrFail().then((user) => user.id),
            createdBy: user.id,
            forJansevak: await User.query().where("uuid", validatedData.relation.assigned_to).firstOrFail().then((user) => user.id),
        });

        // handle query attachments
        if (validatedData.attachments && validatedData.attachments.length > 0) {
            const attachmentCreateMany: Array<{}> = [];
            for (const attachment of validatedData.attachments) {
                await attachment.moveToDisk("./");

                attachmentCreateMany.push({
                    clientName: attachment.clientName,
                    fileName: attachment.fileName,
                    filePath: attachment.filePath,
                    fileType: attachment.extname,
                    mimeType: attachment.type + "/" + attachment.subtype,
                    referenceType: PolymorphicType.Query,
                    referenceId: query?.id,
                    updated_at: DateTime.now(),
                    created_at: DateTime.now(),
                });
            }

            const attachments = await Attachment.createMany(attachmentCreateMany);
            if (!attachments) {
                return Responses.sendServerErrorResponse(response, "Unable to create query attachments");
            }
        }

        if (!query) return Responses.sendServerErrorResponse(response, "Unable to create query");

        return response.status(201).send(Responses.createResponse(Object.assign(query.serialize({
            fields: { omit: ["queryCategory", "queryComments"] },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Query created"));
    }

    /**
     * Show full query details
     * @param request
     * @param response
     * @param auth
     */
    public async showQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create query
        /* Write logic */

        const { id: query_id } = request.params();

        // get query
        const query = await Query.query().where("uuid", query_id).preload("queryCategory").preload("queryComments", (query) => {
            query.preload("user", (query) => {
                query.preload("profile");
            });

            query.orderBy("created_at", "desc");
        }).preload("userRelation", (query) => {
            query.preload("onBehalfOfUser", (query) => {
                query.preload("profile", (query) => {
                    query.preload("address");
                });
            }).preload("createdByUser", (query) => {
                query.preload("profile");
            }).preload("forJansevakUser", (query) => {
                query.preload("profile");
            });
        }).first();

        if (!query) return Responses.sendNotFoundResponse(response, "Query not found");

        const queryAttachments = await query.getAttachmentsUrl();

        return response.status(200).send(Responses.createResponse(Object.assign(query.serialize({
            relations: {
                queryCategory: { fields: { omit: ["archive_at"] } },
                queryComments: {
                    fields: { omit: ["deleted_at", "updated_at"] },
                    relations: {
                        user: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
                userRelation: {
                    relations: {
                        onBehalfOfUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: {
                                    fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] },
                                    relations: {
                                        address: { fields: { omit: ["created_at", "updated_at"] } },
                                    },
                                },
                            },
                        },
                        createdByUser: {
                            fields: { pick: ["uuid", "user_type"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                        forJansevakUser: {
                            fields: { pick: ["uuid", "user_type"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
            },
        }), {
            attachments: queryAttachments,
            totalAttachments: queryAttachments.length,
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Query fetched"));
    }

    public async getMyQueries({ response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get queries
        /* Write logic */

        // get queries that are created by user and on behalf of user
        const queries = await Query.query().whereHas("userRelation", (query) => {
            query.where("created_by", user.id).orWhere("on_behalf_of", user.id);
        }).preload("queryCategory").preload("userRelation", (query) => {
            query.preload("onBehalfOfUser", (query) => {
                query.preload("profile");
            });

            query.preload("forJansevakUser", (query) => {
                query.preload("profile");
            });
        }).orderBy("created_at", "desc");

        return response.status(200).send(Responses.createResponse(queries.map(query => query.serialize({
            fields: { omit: ["queryCategory", "queryComments"] },
            relations: {
                userRelation: {
                    fields: { omit: ["created_at", "updated_at", "deleted_at"] },
                    relations: {
                        onBehalfOfUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                        forJansevakUser: {
                            fields: { pick: ["uuid", "user_type"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Queries fetched"));
    }

    public async getAssignedQueries({ response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to get queries
        /* Write logic */

        // get queries that are assigned to user
        const queries = await Query.query().whereHas("userRelation", (query) => {
            query.where("for_jansevak", user.id);
        }).preload("queryCategory").preload("userRelation", (query) => {
            query.preload("onBehalfOfUser", (query) => {
                query.preload("profile");
            });

            query.preload("forJansevakUser", (query) => {
                query.preload("profile");
            });
        }).orderBy("created_at", "desc");

        return response.status(200).send(Responses.createResponse(queries.map(query => query.serialize({
            fields: { omit: ["queryCategory", "queryComments"] },
            relations: {
                userRelation: {
                    fields: { omit: ["created_at", "updated_at", "deleted_at"] },
                    relations: {
                        onBehalfOfUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                        forJansevakUser: {
                            fields: { pick: ["uuid", "user_type"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
            },
        })), [ResponseCodes.SUCCESS_WITH_DATA], "Queries fetched"));
    }

    /**
     * Get query info
     * @param request
     * @param response
     * @param auth
     */
    public async getQueryInfo({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create query
        /* Write logic */

        const { id: query_id } = request.params();

        // get query
        const query = await Query.query().where("uuid", query_id).preload("queryCategory").preload("userRelation", (query) => {
            query.preload("onBehalfOfUser", (query) => {
                query.preload("profile", (query) => {
                    query.preload("address");
                });
            });

            query.preload("createdByUser", (query) => {
                query.preload("profile");
            });

            query.preload("forJansevakUser", (query) => {
                query.preload("profile");
            });
        }).first();

        if (!query) return Responses.sendNotFoundResponse(response, "Query not found");

        return response.status(200).send(Responses.createResponse(Object.assign(query.serialize({
            relations: {
                queryCategory: { fields: { omit: ["archive_at"] } },
                userRelation: {
                    relations: {
                        onBehalfOfUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: {
                                    fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] },
                                    relations: {
                                        address: { fields: { omit: ["created_at", "updated_at"] } },
                                    },
                                },
                            },
                        },
                        createdByUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                        forJansevakUser: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
            },
        }), {
            totalAttachments: await query.getAttachmentsCount(),
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Query info fetched"));
    }

    /**
     * Get query attachments
     * @param request
     * @param response
     * @param auth
     */
    public async getQueryAttachments({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create query
        /* Write logic */

        const { id: query_id } = request.params();

        // get query
        const query = await Query.findBy("uuid", query_id);
        if (!query) return Responses.sendNotFoundResponse(response, "Query not found");

        const queryAttachments = await query.getAttachmentsUrl();

        return response.status(200).send(Responses.createResponse({
            attachments: queryAttachments,
            totalAttachments: queryAttachments.length,
        }, [ResponseCodes.SUCCESS_WITH_DATA], "Query attachments fetched"));
    }

    /**
     * Get query comments
     * @param request
     * @param response
     * @param auth
     */
    public async getQueryComments({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create query
        /* Write logic */

        const { id: query_id } = request.params();

        // get query
        const query = await Query.findBy("uuid", query_id);
        if (!query) return Responses.sendNotFoundResponse(response, "Query not found");

        await query.load("queryComments", (query) => {
            query.preload("user", (query) => {
                query.preload("profile");
            });

            query.orderBy("created_at", "desc");
        });

        const _serializedQuery = query.serialize({
            relations: {
                queryComments: {
                    fields: { omit: ["deleted_at", "updated_at"] },
                    relations: {
                        user: {
                            fields: { pick: ["uuid", "user_type", "phone_number"] },
                            relations: {
                                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                            },
                        },
                    },
                },
            },
        });

        return response.status(200).send(Responses.createResponse(_serializedQuery.queryComments, [ResponseCodes.SUCCESS_WITH_DATA], "Query comments fetched"));
    }

    public async getOnBehalfOfList({ response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);
        await user.load("profile"); // load profile

        // on behalf of list
        const onBehalfOfObject: any = {};

        // add self to on behalf of
        onBehalfOfObject["self"] = user.serialize({
            fields: { pick: ["uuid", "user_type", "phone_number"] },
            relations: {
                profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
            },
        });

        // get family members
        let familyGroup: Group;

        await user.load("groups", (query) => {
            query.where("type", GroupTypes.FAMILY);
        });

        if (user.groups.length > 0) {
            // get the group i am in
            familyGroup = user.groups[0];
        } else {
            // get my family group
            await user.load("familyGroup");
            familyGroup = user.familyGroup;
        }

        if (familyGroup) {
            // get family members
            await familyGroup.load("users", (query) => {
                query.preload("profile");
            });

            // filter out self
            const familyMembers = familyGroup.users.filter((member) => member.uuid !== user.uuid);

            // if there are family members
            if (familyMembers.length > 0) {
                onBehalfOfObject["family"] = familyMembers.map((member) => member.serialize({
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                }));
            }
        }

        // get group members
        const groups = await user.related("groups").query().whereNot("type", GroupTypes.FAMILY).preload("users", (query) => {
            query.preload("profile");
        });

        if (groups.length > 0) {
            onBehalfOfObject["groups"] = groups.map((group) => {
                // filter out self
                return {
                    uuid: group.uuid,
                    name: group.name,
                    users: group.users.filter((member) => member.uuid !== user.uuid).map((member) => member.serialize({
                        fields: { pick: ["uuid", "user_type", "phone_number"] },
                        relations: {
                            profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                        },
                    })),
                };
            });
        }

        return response.status(200).send(Responses.createResponse(onBehalfOfObject, [ResponseCodes.SUCCESS_WITH_DATA], "On behalf of list fetched"));
    }

    public async addRegularComment({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */

        let validatedData: { query: string; comment: string; };
        try {
            validatedData = await request.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                    })]),
                    comment: schema.string({ trim: true }, [rules.maxLength(255)]),
                }),
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.findByOrFail("uuid", validatedData.query);

        // add comment
        const _comment = await query.related("queryComments").create({
            type: QueryCommentTypes.COMMENT,
            comment: validatedData.comment,
            userId: user.id,
        });

        await _comment.load("user", (query) => {
            query.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(_comment.serialize({
            relations: {
                user: {
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Comment added"));
    }

    public async addLogComment({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */


        let validatedData: { query: string; comment: string | undefined; status: string | QueryStatuses; };
        try {
            validatedData = await request.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                    })]),
                    comment: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
                    status: schema.enum(QueryStatusesValues),
                }),
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.findByOrFail("uuid", validatedData.query);

        // add comment
        const _comment = await query.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            comment: validatedData.comment,
            status: validatedData.status as QueryStatuses | undefined,
            userId: user.id,
        });

        // update query status
        query.status = validatedData.status as QueryStatuses;
        await query.save();

        await _comment.load("user", (query) => {
            query.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(_comment.serialize({
            relations: {
                user: {
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Comment added"));
    }

    public async statusReviewQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */

        const { id: query_id } = request.params();

        let validatedData: { query: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                        where: { status: QueryStatuses.CREATED, deleted_at: null },
                    })]),
                }),
                data: { query: query_id },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.query().where("uuid", validatedData.query).preload("userRelation").firstOrFail();

        // Only assigned Jansevak and Admin can change the status to in review
        if (user.userType !== UserTypes.ADMIN && query.userRelation.forJansevak !== user.id) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "You are not authorized to update query status"));
        }

        // add comment
        await query.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            status: QueryStatuses.IN_REVIEW,
            userId: user.id,
        });

        // update query status
        query.status = QueryStatuses.IN_REVIEW;
        await query.save();

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Query status updated"));
    }

    public async statusProgressQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */

        const { id: query_id } = request.params();
        const { comment } = request.only(["comment"]);

        let validatedData: { query: string; comment: string | undefined; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                        where: { deleted_at: null },
                        whereNot: { status: QueryStatuses.IN_PROGRESS },
                    })]),
                    comment: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
                }),
                data: { query: query_id, comment },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.query().where("uuid", validatedData.query).preload("userRelation").firstOrFail();

        // Only assigned Jansevak and Admin can change the status to in review
        if (user.userType !== UserTypes.ADMIN && query.userRelation.forJansevak !== user.id) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "You are not authorized to update query status"));
        }

        // check if query has any comment with status in review
        const queryComment = await QueryComment.query().where("query_id", query.id).where("status", QueryStatuses.IN_REVIEW).first();
        if (!queryComment) {
            // add comment with status in review
            await query.related("queryComments").create({
                type: QueryCommentTypes.LOG,
                status: QueryStatuses.IN_REVIEW,
                userId: user.id,
            });
        }

        // add comment
        await query.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            status: QueryStatuses.IN_PROGRESS,
            userId: user.id,
            ...(validatedData.comment && { comment }),
        });

        // update query status
        query.status = QueryStatuses.IN_PROGRESS;
        await query.save();

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Query status updated"));
    }

    public async statusResolvedQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */

        const { id: query_id } = request.params();

        let validatedData: { query: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                        where: { deleted_at: null, status: QueryStatuses.IN_PROGRESS },
                        whereNot: { status: QueryStatuses.RESOLVED },
                    })]),
                }),
                data: { query: query_id },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.query().where("uuid", validatedData.query).preload("userRelation").firstOrFail();

        // Only assigned Jansevak and Admin can change the status to in review
        if (user.userType !== UserTypes.ADMIN && query.userRelation.forJansevak !== user.id) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "You are not authorized to update query status"));
        }

        // add comment
        await query.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            status: QueryStatuses.RESOLVED,
            userId: user.id,
        });

        // update query status
        query.status = QueryStatuses.RESOLVED;
        await query.save();

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Query status updated"));
    }

    public async statusRejectedQuery({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to add comment
        /* Write logic */

        const { id: query_id } = request.params();
        const { comment } = request.only(["comment"]);

        let validatedData: { query: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    query: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                        where: { deleted_at: null, status: QueryStatuses.IN_PROGRESS },
                        whereNot: { status: QueryStatuses.REJECTED },
                    })]),
                    comment: schema.string.optional({ trim: true }),
                }),
                data: { query: query_id, comment },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get query
        const query = await Query.query().where("uuid", validatedData.query).preload("userRelation").firstOrFail();

        // Only assigned Jansevak and Admin can change the status to in review
        if (user.userType !== UserTypes.ADMIN && query.userRelation.forJansevak !== user.id) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "You are not authorized to update query status"));
        }

        // add comment
        await query.related("queryComments").create({
            type: QueryCommentTypes.LOG,
            status: QueryStatuses.REJECTED,
            userId: user.id,
        });

        // update query status
        query.status = QueryStatuses.REJECTED;
        await query.save();

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Query status updated"));
    }
}
