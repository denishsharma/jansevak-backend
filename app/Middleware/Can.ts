import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";

export default class Can {
    public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, permissionNames: string[]) {
        // check if user is logged in
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user has the required permissions
        await user.load("permissions");
        const userPermissions = user.permissions.map((permission) => permission.slug);

        // check if user has all the required permissions
        const hasAllPermissions = permissionNames.every((permissionName) => userPermissions.includes(permissionName));

        if (!hasAllPermissions) {
            return response.status(403).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        await next();
    }
}
