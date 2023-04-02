import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";
import ValidationException from "App/Exceptions/ValidationException";
import { getLoggedInUser } from "App/Helpers/Authentication";
import { FeedbackTypes, FeedbackTypesValues, getAverageRatingForUser } from "App/Helpers/Feedbacks";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import Feedback from "App/Models/Feedback";
import Query from "App/Models/Query";
import User from "App/Models/User";
import UserQuery from "App/Models/UserQuery";

export default class FeedbacksController {
    public async getFeedbacksOfUser({ params, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // validate the data
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
            });
        } catch (e) {
            return new ValidationException(e.message, e.messages);
        }

        // get the user
        const userToGetFeedbacksOf = await User.findByOrFail("uuid", validatedData.userId);

        // get the feedbacks
        const feedbacks = await getAverageRatingForUser(userToGetFeedbacksOf);

        return response.status(200).send(Responses.createResponse(feedbacks, [ResponseCodes.SUCCESS_WITH_DATA], "Feedbacks fetched successfully."));
    }

    public async giveFeedback({ request, response, auth }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // validate the data
        let validatedData: {
            type: FeedbackTypes;
            rating: number | undefined;
            for_user: string | undefined;
            for_query: string | undefined;
            subject: string;
            text: string | undefined;
        };
        try {
            validatedData = await validator.validate({
                schema: schema.create({
                    type: schema.enum(FeedbackTypesValues),
                    rating: schema.number.optional([rules.range(1, 5), rules.requiredWhen("type", "in", [FeedbackTypes.PLATFORM, FeedbackTypes.USER, FeedbackTypes.QUERY])]),
                    for_user: schema.string.optional({ trim: true }, [rules.requiredWhen("type", "in", [FeedbackTypes.USER, FeedbackTypes.QUERY]), rules.uuid(), rules.notIn([user.uuid]), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                    for_query: schema.string.optional({ trim: true }, [rules.requiredWhen("type", "in", [FeedbackTypes.QUERY]), rules.uuid(), rules.exists({
                        table: "queries",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                    subject: schema.string({ trim: true }),
                    text: schema.string.optional({ trim: true }),
                }),
                data: request.only(["type", "rating", "for_user", "for_query", "subject", "text"]),
                reporter: validator.reporters.jsonapi,
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        const forUser = await User.findBy("uuid", validatedData.for_user || "");
        const forQuery = await Query.findBy("uuid", validatedData.for_query || "");

        // check if type is query and for_query is assigned to for_user
        if (validatedData.type === FeedbackTypes.QUERY) {
            const userQuery = await UserQuery.query().where("query_id", forQuery!.id).where("for_jansevak", forUser!.id).first();
            if (!userQuery) return response.status(400).send(Responses.createResponse(null, [ResponseCodes.INVALID_REQUEST], "Query is not assigned to the user!"));
        }

        // create feedback
        const feedback = await Feedback.create({
            userId: user.id,
            type: validatedData.type,
            rating: [FeedbackTypes.USER, FeedbackTypes.PLATFORM, FeedbackTypes.QUERY].includes(validatedData.type!) ? validatedData.rating : undefined,
            receiverId: [FeedbackTypes.USER, FeedbackTypes.QUERY].includes(validatedData.type!) ? forUser?.id : undefined,
            queryId: [FeedbackTypes.QUERY].includes(validatedData.type!) ? forQuery?.id : undefined,
            subject: validatedData.subject,
            text: validatedData.text,
        });

        return response.status(200).send(Responses.createResponse(feedback, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Feedback submitted successfully!"));
    }
}
