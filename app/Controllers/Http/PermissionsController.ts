import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import User from "App/Models/User";
import Permission from "App/Models/Permission";

export default class PermissionsController {
    public async assignPermissionToUser({ auth, bouncer, request, response }: HttpContextContract) {
        const { user, assignee, permission_uuid } = await this.checkAuthAndAssignee(auth, request, response);

        const allows = await bouncer.forUser(user).with("PermissionPolicy").allows("assignPermissionToUser", assignee);
        if (!allows) {
            return response.status(403).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // check if permission exists
        const permissions = await Permission.query().whereIn("uuid", permission_uuid).exec();

        if (permissions.length === 0) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PERMISSION_NOT_FOUND], "Permission not found"));
        }

        // assign permission to user
        await assignee.load("permissions");
        const assigneePermissions = assignee.permissions;

        // check if user already has permission
        for (const permission of permissions) {
            if (assigneePermissions.find((assigneePermission) => assigneePermission.id === permission.id)) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PERMISSION_ALREADY_ASSIGNED], "Permission already assigned"));
            }
        }

        await assignee.related("permissions").sync(permissions.map((permission) => permission.id), false);

        return response.status(200).json(Responses.createResponse({}, [ResponseCodes.PERMISSION_ASSIGNED], "Permission assigned"));
    }

    public async revokePermissionFromUser({ auth, bouncer, request, response }: HttpContextContract) {
        const { user, assignee, permission_uuid } = await this.checkAuthAndAssignee(auth, request, response);

        const allows = await bouncer.forUser(user).with("PermissionPolicy").allows("revokePermissionFromUser", assignee);
        if (!allows) {
            return response.status(403).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // check if permission exists
        const permissions = await Permission.query().whereIn("uuid", permission_uuid).exec();

        if (permissions.length === 0) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PERMISSION_NOT_FOUND], "Permission not found"));
        }

        // revoke permission from user
        await assignee.load("permissions");
        const assigneePermissions = assignee.permissions;

        // check if user has permission
        for (const permission of permissions) {
            if (!assigneePermissions.find((assigneePermission) => assigneePermission.id === permission.id)) {
                return response.status(400).json(Responses.createResponse({}, [ResponseCodes.PERMISSION_NOT_ASSIGNED], "Permission not assigned"));
            }
        }

        await assignee.related("permissions").detach(permissions.map((permission) => permission.id));
    }

    private async checkAuthAndAssignee(auth, request, response): Promise<{ user: User, assignee: User, permission_uuid: string[] }> {
        // check if user is authenticated
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        const { user_uuid, permission_uuid } = request.only(["user_uuid", "permission_uuid"]);

        // Check if user_uuid and permission_uuid are provided
        if (!user_uuid || !permission_uuid) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "User UUID or permission UUID not provided"));
        }

        // Check if assignee exists
        const assignee = await User.findBy("uuid", user_uuid);

        if (!assignee) {
            return response.status(400).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_FOUND], "Assignee not found"));
        }

        return { user, assignee, permission_uuid };
    }
}
