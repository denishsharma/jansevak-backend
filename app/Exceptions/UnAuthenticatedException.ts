import { Exception } from "@adonisjs/core/build/standalone";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Responses, { ResponseCodes } from "App/Helpers/Responses";

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new UnAuthenticatedException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class UnAuthenticatedException extends Exception {
    constructor(message: string) {
        super(message, 401, "E_UNAUTHENTICATED_EXCEPTION");
    }

    public async handle(error: this, { response }: HttpContextContract) {
        response.status(error.status).send(Responses.createResponse(null, [ResponseCodes.USER_NOT_AUTHENTICATED], error.message));
    }
}
