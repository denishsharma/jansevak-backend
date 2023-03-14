import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import Group from "App/Models/Group";
import { GroupTypes } from "App/Helpers/Groups";
import { validator, schema, rules } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import ValidationException from "App/Exceptions/ValidationException";

export default class GroupsController {
    public async getFamilyGroupMembers({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        let familyGroup: Group;

        // check if you are in any family group
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

        if (!familyGroup) return Responses.sendInvalidRequestResponse(response, "You do not have a family group");

        // load users in family group
        await familyGroup.load("createdBy", (query) => {
            query.preload("profile");
        });
        await familyGroup.load("users", (query) => {
            query.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(familyGroup.serialize({
            fields: { pick: ["uuid", "name", "type"] },
            relations: {
                users: {
                    fields: { pick: ["uuid", "phone_number", "user_type", "is_verified"] },
                    relations: {
                        profile: {
                            fields: { pick: ["uuid", "first_name", "last_name", "gender", "date_of_birth", "profile_picture"] },
                        },
                    },
                },
                createdBy: {
                    fields: { pick: ["uuid", "phone_number", "user_type", "is_verified"] },
                    relations: {
                        profile: {
                            fields: { pick: ["uuid", "first_name", "last_name", "gender", "date_of_birth", "profile_picture"] },
                        },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Family group members retrieved successfully"));
    }

    /**
     * Add an existing user to a family group
     * @param request
     * @param response
     * @param auth
     * @param bouncer
     */
    public async addExistingUserToFamilyGroup({ request, response, auth, bouncer }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // only verified users can perform this action
        const allows = await bouncer.forUser(user).with("GroupPolicy").allows("canWriteExistingMemberToFamily");
        if (!allows) return Responses.sendUnauthorizedResponse(response, "You must verify your account before you can perform this action");

        let validatedData = await this.validatedDataFamilyGroupMembers(request, "add");

        const userToAdd = await User.findByOrFail("uuid", validatedData.user);
        if (!userToAdd) return Responses.sendInvalidRequestResponse(response, "User does not exist");

        let familyGroup;

        // check if you are in any family group
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

        if (!familyGroup) return Responses.sendInvalidRequestResponse(response, "You do not have a family group");


        // load users in family group
        await familyGroup.load("users");

        // check if user to add is already in family group
        if (familyGroup.users.some((_user) => _user.id === userToAdd.id)) return Responses.sendInvalidRequestResponse(response, "User is already in your family group");

        // check if you are in the family group
        // if not then add yourself to the family group
        if (!familyGroup.users.some((_user) => _user.id === user.id)) {
            await familyGroup.related("users").sync({
                [user.id]: {
                    added_by: user.id,
                },
            }, false);
        }

        // check if user to add is already in any other family group
        await userToAdd.load("groups", (query) => {
            query.where("type", GroupTypes.FAMILY);
        });
        if (userToAdd.groups.length > 0) return Responses.sendInvalidRequestResponse(response, "User is already in another family group");

        // add user to family group
        await familyGroup.related("users").sync({
            [userToAdd.id]: {
                added_by: user.id,
            },
        }, false);

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "User added to family group"));
    }

    /**
     * Remove a member from a family group
     * @param request
     * @param response
     * @param auth
     * @param bouncer
     */
    public async removeMemberFromFamilyGroup({ request, response, auth, bouncer }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // only verified users can perform this action
        const allows = await bouncer.forUser(user).with("GroupPolicy").allows("canWriteExistingMemberToFamily");
        if (!allows) return Responses.sendUnauthorizedResponse(response, "You must verify your account before you can perform this action");

        let validatedData = await this.validatedDataFamilyGroupMembers(request, "remove");

        const userToRemove = await User.findByOrFail("uuid", validatedData.user);
        if (!userToRemove) return Responses.sendInvalidRequestResponse(response, "User does not exist");

        let familyGroup;

        // check if you are in any family group
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

        if (!familyGroup) return Responses.sendInvalidRequestResponse(response, "You do not have a family group");

        // load users in family group
        await familyGroup.load("users");

        // check if user to remove is in family group
        if (!familyGroup.users.some((_user) => _user.id === userToRemove.id)) return Responses.sendInvalidRequestResponse(response, "User is not in your family group");

        // check if user to remove is owner of the family group
        if (familyGroup.owner_id === userToRemove.id) return Responses.sendInvalidRequestResponse(response, "You cannot remove the owner of the family group");

        // remove user from family group
        await familyGroup.related("users").detach([userToRemove.id]);

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "User removed from family group"));
    }

    public async createNewMemberForFamilyGroup({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // get type of authenticated user
        const userType = user.userType;
    }

    /**
     * Create a general group for a user
     * @param request
     * @param response
     * @param auth
     * @param bouncer
     */
    public async createGroup({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is allowed to create group
        /* Write your code here */

        let validatedData: { name: string; description: string | undefined; };
        try {
            validatedData = await request.validate({
                schema: schema.create({
                    name: schema.string({ trim: true }, [rules.minLength(3)]),
                    description: schema.string.optional({ trim: true }, [rules.minLength(3)]),
                }),
            });
        } catch (error) {
            throw new UnknownErrorException(error.message, error.messages);
        }

        // create group
        const group = await user.related("myGroups").create({
            name: validatedData.name,
            description: validatedData.description,
            type: GroupTypes.GENERAL,
        });

        // add self as member of group
        await group.related("users").sync({
            [user.id]: { added_by: user.id },
        }, false);

        await group.load("createdBy", (query) => {
            query.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(group.serialize({
            relations: {
                createdBy: {
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Group created successfully"));
    }

    /**
     * Add members to a non-family group
     * @param request
     * @param response
     * @param auth
     * @param params
     */
    public async addMemberToGroup({ request, response, auth, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        let validatedData = await this.validatedDataGeneralGroupMembers(request, params, "add");

        const group = await Group.findBy("uuid", validatedData.group_id);
        if (!group) return Responses.sendNotFoundResponse(response, "Group not found");

        // check if user is allowed to add member to group
        /* Write your code here */

        // get users to add from query
        const usersToAdd = await User.query().whereIn("uuid", validatedData.users);

        // get existing users in group
        const existingUsers = await group.related("users").query().select("uuid");

        // get users to add that are not already in group
        const usersToAddFiltered = usersToAdd.filter((user) => !existingUsers.find((existingUser) => existingUser.uuid === user.uuid));

        // check if there are no users to add
        if (usersToAddFiltered.length === 0) return Responses.sendInvalidRequestResponse(response, "No users to add");

        // add users to group with pivot data
        const usersToAddWithPivotData = usersToAddFiltered.map((user) => {
            return {
                [user.id]: {
                    added_by: user.id,
                },
            };
        }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

        // sync users to group
        await group.related("users").sync(usersToAddWithPivotData, false);

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Users added to group successfully"));
    }

    /**
     * Remove members from a non-family group
     * @param request
     * @param response
     * @param auth
     * @param params
     */
    public async removeMemberFromGroup({ request, response, auth, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        let validatedData = await this.validatedDataGeneralGroupMembers(request, params, "remove");

        const group = await Group.findBy("uuid", validatedData.group_id);
        if (!group) return Responses.sendNotFoundResponse(response, "Group not found");

        // check if user is allowed to remove member from group
        /* Write your code here */

        // get users to remove from query
        const usersToRemove = await User.query().whereIn("uuid", validatedData.users);

        // get existing users in group
        const existingUsers = await group.related("users").query().select("uuid");

        // you cannot remove yourself from a group
        if (usersToRemove.find((_user) => _user.uuid === user.uuid)) return Responses.sendInvalidRequestResponse(response, "You cannot remove yourself from a group");

        // get users to remove that are already in group
        const usersToRemoveFiltered = usersToRemove.filter((user) => existingUsers.find((existingUser) => existingUser.uuid === user.uuid));

        // check if there are no users to remove
        if (usersToRemoveFiltered.length === 0) return Responses.sendInvalidRequestResponse(response, "No users to remove");

        // remove users from group
        await group.related("users").detach(usersToRemoveFiltered.map((user) => user.id));

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Users removed from group successfully"));
    }

    /**
     * Get members of a non-family group
     * @param response
     * @param auth
     * @param params
     */
    public async getGroupMembers({ response, auth, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        const isAdmin = true;

        const { id: group_id } = params;

        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    group_id: schema.string([rules.uuid(), rules.exists({
                        table: "groups",
                        column: "uuid",
                        where: isAdmin ? undefined : { created_by: user.id },
                        whereNot: { type: GroupTypes.FAMILY },
                    })]),
                }),
                data: { group_id },
                messages: {
                    "group_id.exists": "Group not found",
                    "group_id.uuid": "Group id is not valid UUID",
                },
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const group = await Group.withTrashed().where("uuid", validatedData.group_id).first();
        if (!group) return Responses.sendNotFoundResponse(response, "Group not found");

        // check if user is allowed to get group members
        /* Write your code here */

        // load users to group
        await group.load("createdBy", (query) => {
            query.preload("profile");
        });
        await group.load("users", (query) => {
            query.preload("profile");
        });

        return response.status(200).send(Responses.createResponse(group.serialize({
            fields: isAdmin ? undefined : { pick: ["uuid", "name", "type", "description"] },
            relations: {
                createdBy: {
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                },
                users: {
                    fields: { pick: ["uuid", "user_type", "phone_number"] },
                    relations: {
                        profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                    },
                },
            },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Group members retrieved successfully"));
    }

    public async getGroups({ response, auth, params }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        const { user: user_id } = params;

        let validatedData;
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    user_id: schema.string([rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { user_id },
                messages: {
                    "user_id.exists": "User not found",
                    "user_id.uuid": "User id is not valid UUID",
                },
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const userToGetGroups = await User.findBy("uuid", validatedData.user_id);
        if (!userToGetGroups) return Responses.sendNotFoundResponse(response, "User not found");

        // check if user is allowed to get groups
        /* Write your code here */

        // get groups
        const groups = await userToGetGroups.related("groups").query().whereNot({ type: GroupTypes.FAMILY });
        await userToGetGroups.load("profile");

        return response.status(200).send(Responses.createResponse({
            groups: groups.map((group) => group.serialize({
                fields: { pick: ["uuid", "name", "type", "description"] },
            })) as any,
            created_by: userToGetGroups.serialize({
                fields: { pick: ["uuid", "user_type", "phone_number"] },
                relations: {
                    profile: { fields: { pick: ["first_name", "last_name", "full_name", "initials_and_last_name", "avatar_url"] } },
                },
            } as any),
        }, [ResponseCodes.SUCCESS_WITH_DATA], "Groups retrieved successfully"));
    }

    private async validatedDataGeneralGroupMembers(request: HttpContextContract["request"], params: HttpContextContract["params"], action: "add" | "remove") {
        const { id: group_id } = params;
        const { users } = request.only(["users"]);

        let validatedData: { group_id: string; users: string[]; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    group_id: schema.string([rules.uuid(), rules.exists({
                        table: "groups",
                        column: "uuid",
                        where: { deleted_at: null },
                        whereNot: { type: GroupTypes.FAMILY },
                    })]),
                    users: schema.array([rules.minLength(1)]).members(schema.string([rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: {
                            deleted_at: null,
                            ...(action === "add" && { is_verified: true }),
                        },
                    })])),
                }),
                data: { group_id, users },
                messages: {
                    "group_id.exists": "Group not found",
                    "group_id.uuid": "Group id is not valid UUID",
                    "users.required": "Users is required",
                    "users.minLength": "At least one user is required",
                    "users.*.uuid": "User id is not valid UUID",
                    "users.*.exists": "Users not found",
                    "users.*.is_verified": "Only verified users can be added to a group",
                },
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        return validatedData;
    }

    private async validatedDataFamilyGroupMembers(request: HttpContextContract["request"], action: "add" | "remove") {
        const { user: user_id } = request.only(["user"]);

        let validatedData: { user: string };
        try {
            validatedData = await request.validate({
                schema: schema.create({
                    user: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: {
                            deleted_at: null,
                            ...(action === "add" && { is_verified: true }),
                        },
                    })]),
                }),
                data: { user: user_id },
                messages: {
                    required: "The {{ field }} is required",
                    "user.uuid": "User ID is not a valid UUID",
                    "user.exists": "User does not exist",
                    "user.is_verified": "Only verified users can be added to a group",
                },
                reporter: validator.reporters.api,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        return validatedData;
    }
}
