import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import * as console from "console";

export enum UserTypes {
    ADMIN = <any>"admin",
    JANSEVAK = <any>"jansevak",
    NAGRIK = <any>"nagrik",
}

/**
 * Get the logged in user
 * @param auth
 */
export async function getLoggedInUser(auth: HttpContextContract["auth"]) {
    try {

        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user;

        if (!user) {
            return undefined;
        }

        return user;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}
