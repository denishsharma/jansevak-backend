import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";
import Group from "App/Models/Group";
import { GroupTypes } from "App/Helpers/Groups";

export default class GroupPolicy extends BasePolicy {
    public async canWriteExistingMemberToFamily(user: User) {
        return user.isVerified && user.isRegistered && user.isSetupCompleted;
    }

    /**
     * Check if user can create a general group
     * @param user
     */
    public async canCreateGroup(user: User) {
        return await userHasPermissions(["CAN_CREATE_GROUP"], user);
    }

    /**
     * Check if user can delete a general group
     * @param user
     * @param group
     */
    public async canDeleteGroup(user: User, group: Group) {
        // check if group is not a family group
        if (group.type === GroupTypes.FAMILY) {
            return false;
        }

        // check if user is the owner of the group
        return group.userId === user.id;
    }

    /**
     * Check if user can add user to general group
     * @param user
     * @param group
     */
    public async canAddUserToGroup(user: User, group: Group) {
        // check if group is not a family group
        if (group.type === GroupTypes.FAMILY) {
            return false;
        }

        // check if user is the owner of the group
        if (group.userId !== user.id) {
            return false;
        }

        // check if user has permission to add user to group
        return await userHasPermissions(["CAN_ADD_USER_TO_GROUP"], user);
    }

    /**
     * Check if user can remove user from general group
     * @param user
     * @param group
     */
    public async canRemoveUserFromGroup(user: User, group: Group) {
        // check if group is not a family group
        if (group.type === GroupTypes.FAMILY) {
            return false;
        }

        // check if user is the owner of the group
        return group.userId === user.id;
    }

    /**
     * Check if user can add family member to family group
     * @param user
     * @param group
     * @param familyMember
     */
    public async canAddFamilyMember(user: User, group: Group, familyMember: User) {
        // check if group is a family group
        if (group.type !== GroupTypes.FAMILY) {
            return false;
        }

        // check if user has permission to add family member to family group
        if (!await userHasPermissions(["CAN_ADD_FAMILY_MEMBER_TO_GROUP"], user)) {
            return false;
        }

        // check if family member is not part of any other family group
        const familyMemberGroups = await familyMember.related("groups").query().where("type", GroupTypes.FAMILY);
        if (familyMemberGroups.length > 0) {
            return false;
        }


        // check if user is the part of this family group
        const userIsPartOfFamilyGroup = await group.related("users").query().where("id", user.id).first();
        return !!userIsPartOfFamilyGroup;
    }

    /**
     * Check if user can remove family member from family group
     * @param user
     * @param group
     * @param familyMember
     */
    public async canRemoveFamilyMember(user: User, group: Group, familyMember: User) {
        // check if group is a family group
        if (group.type !== GroupTypes.FAMILY) {
            return false;
        }

        // check if user and family member is the part of this family group
        const familyMembers = await group.related("users").query().whereIn("id", [user.id, familyMember.id]);
        if (familyMembers && familyMembers.length !== 2) {
            return false;
        }

        // check if user is the owner of the group or family member was added by the user
        const familyMemberAddedByUser = await group.related("users").query().wherePivot("added_by", user.id).where("id", familyMember.id).first();
        return !!familyMemberAddedByUser || group.userId === user.id;
    }
}
