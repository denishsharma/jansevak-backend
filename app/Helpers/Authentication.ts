import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export enum UserTypes {
    ADMIN = "admin",
    JANSEVAK = "jansevak",
    NAGRIK = "nagrik",
}

/**
 * Get the logged in user
 * @param auth
 */
export async function getLoggedInUser(auth: HttpContextContract["auth"]) {
    await auth.use("jwt").authenticate();
    const user = auth.use("jwt").user;

    if (!user) {
        return undefined;
    }

    return user;
}
