import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import ValidationException from "App/Exceptions/ValidationException";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";
import UserQuery from "App/Models/UserQuery";
import { QueryStatuses } from "App/Helpers/Queries";

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

        const summaryStats = {
            total: 0,
            pending: 0,
            resolved: 0,
            rejected: 0,
            in_progress: 0,
            in_review: 0,
            created: 0,
        };

        // load queries of user
        const queries = await UserQuery.query().where("for_jansevak", userToFetchStatusFrom.id).orWhere("created_by", userToFetchStatusFrom.id).orWhere("on_behalf_of", userToFetchStatusFrom.id).preload("query");

        const resolvedQueries = queries.filter((query) => query.query.status === QueryStatuses.RESOLVED);
        const pendingQueries = queries.filter((query) => query.query.status !== QueryStatuses.RESOLVED && query.query.status !== QueryStatuses.REJECTED);
        const rejectedQueries = queries.filter((query) => query.query.status === QueryStatuses.REJECTED);
        const inProgressQueries = queries.filter((query) => query.query.status === QueryStatuses.IN_PROGRESS);
        const inReviewQueries = queries.filter((query) => query.query.status === QueryStatuses.IN_REVIEW);
        const createdQueries = queries.filter((query) => query.query.status === QueryStatuses.CREATED);

        summaryStats.total = queries.length;
        summaryStats.resolved = resolvedQueries.length;
        summaryStats.pending = pendingQueries.length;
        summaryStats.rejected = rejectedQueries.length;
        summaryStats.in_progress = inProgressQueries.length;
        summaryStats.in_review = inReviewQueries.length;
        summaryStats.created = createdQueries.length;

        return response.status(200).send(Responses.createResponse(summaryStats, [ResponseCodes.SUCCESS_WITH_DATA], "Successfully fetched query status summary."));
    }
}
