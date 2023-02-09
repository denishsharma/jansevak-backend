import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";

export enum UserTypes {
    ADMIN = "admin",
    JANSEVAK = "jansevak",
    NAGRIK = "nagrik",
}

export async function getLoggedInUser({ auth, response }: HttpContextContract) {
    await auth.use("jwt").authenticate();
    const user = auth.use("jwt").user;

    if (!user) {
        return response.status(401).json(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
    }

    return user;
}
