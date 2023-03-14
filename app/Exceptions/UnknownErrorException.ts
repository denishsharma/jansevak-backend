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
| new UnknownErrorException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class UnknownErrorException extends Exception {
    private readonly _data: any;

    constructor(message: string, data: any = undefined) {
        super(message, 500, "E_UNKNOWN_ERROR_EXCEPTION");
        this._data = data;
    }

    public async handle(error: this, { response }: HttpContextContract) {
        response.status(error.status).send(Responses.createResponse(this._data, [ResponseCodes.UNKNOWN_ERROR], error.message));
    }
}
