import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import Group from "App/Models/Group";
import { GroupTypes } from "App/Helpers/Groups";
import User from "App/Models/User";

export default class GroupsController {
    public async addFamilyMember({ request, response, auth, bouncer }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user already has a family group
        let familyGroup = await Group.query().where("userId", user.id).where("type", "family").first();

        // if not then create one
        if (!familyGroup) {
            familyGroup = await Group.create({
                name: `${user.uuid}-family`,
                type: GroupTypes.FAMILY,
                userId: user.id,
            });
        }

        // get family member data from request
        const { member_uuid } = request.only(["member_uuid"]);

        // check if member_uuid is not empty
        if (!member_uuid) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Member uuid cannot be empty"));
        }

        // check if member_uuid is not same as user uuid
        if (member_uuid === user.uuid) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Member uuid cannot be same as user uuid"));
        }

        // get family member
        const familyMember = await User.findBy("uuid", member_uuid);

        // check if family member exists
        if (!familyMember) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Family member not found"));
        }

        // check if member_uuid is already in family group
        const member = await familyGroup.related("users").query().where("uuid", member_uuid).first();
        if (member) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Member uuid already in family group"));
        }

        // check if user is allowed to add family member
        const allows = await bouncer.forUser(user).with("GroupPolicy").allows("canAddFamilyMember", familyGroup, familyMember);
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // add family member to family group
        await familyGroup.related("users").sync({
            [familyMember.id]: {
                added_by: user.id,
            },
        }, false);

        return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Family member added successfully"));
    }

    /**
     * Create a general group for a user
     * @param request
     * @param response
     * @param auth
     * @param bouncer
     */
    public async createGroup({ request, response, auth, bouncer }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is allowed to create a group
        const allows = await bouncer.forUser(user).with("GroupPolicy").allows("canCreateGroup");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get group data from request
        const { name, description } = request.only(["name", "description"]);

        // check if group name is not empty
        if (!name) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Group name cannot be empty"));
        }

        const group = await Group.create({
            name,
            description,
            userId: user.id,
        });

        return response.status(201).send(Responses.createResponse(group.serialize({
            fields: { pick: ["name", "description", "type"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Group created successfully"));
    }

}
