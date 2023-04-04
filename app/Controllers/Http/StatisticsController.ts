import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import ValidationException from "App/Exceptions/ValidationException";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { getQueryStatusSummary } from "App/Helpers/Statistics";
import User from "App/Models/User";

export default class StatisticsController {
    public async queryStatus({ response, params, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // validate params
        let validatedData: { userId: string; };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    userId: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                }),
                data: { userId: params.userId },
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // get user to fetch status from
        const userToFetchStatusFrom = await User.query().where("uuid", validatedData.userId).firstOrFail();

        const summaryStats = await getQueryStatusSummary(userToFetchStatusFrom.id);

        return response.status(200).send(Responses.createResponse(summaryStats, [ResponseCodes.SUCCESS_WITH_DATA], "Successfully fetched query status summary."));
    }
}
