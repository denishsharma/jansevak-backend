import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Question from "App/Models/Question";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import { getLoggedInUser } from "App/Helpers/Authentication";
import slugify from "slugify";
import { string } from "@ioc:Adonis/Core/Helpers";

export default class QuestionsController {
    /**
     * Get all questions
     * @param response
     */
    public async index({ response }: HttpContextContract) {
        const questions = await Question.query().select("question", "answer", "slug");

        // check if questions exist
        if (!questions || questions.length < 1) return Responses.sendNotFoundResponse(response, "Questions not found");

        return response.status(200).send(Responses.createResponse(questions, [ResponseCodes.SUCCESS_WITH_DATA], "Questions found"));
    }

    /**
     * Create question and answer
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async create({ request, auth, bouncer, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canWriteQuestion");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        // get question and answer from request
        const { question, answer } = request.only(["question", "answer"]);

        // check if question and answer are not empty
        if (!question || !answer) return Responses.sendInvalidRequestResponse(response, "Question and answer are required");

        // create question and return response
        const questionModel = await Question.create({
            question,
            answer,
            slug: slugify(`${question} ${string.generateRandom(4)}`, { lower: true, strict: true }),
        });

        return response.status(201).send(Responses.createResponse(questionModel.serialize({
            fields: { pick: ["question", "answer", "slug"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Question created"));
    }


    /**
     * Update question and answer
     * @param auth
     * @param bouncer
     * @param request
     * @param response
     */
    public async update({ auth, bouncer, request, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canWriteQuestion");
        if (!allows) return Responses.sendUnauthorizedResponse(response);


        // get question, answer and slug from request
        const { question, answer, slug } = request.only(["question", "answer", "slug"]);

        // check if slug is not empty
        if (!slug) return Responses.sendInvalidRequestResponse(response, "Slug is required");

        // check if question and answer are not empty
        if (!question || !answer) return Responses.sendInvalidRequestResponse(response, "Question and answer are required");

        // check if question exists
        const questionModel = await Question.findBy("slug", slug);
        if (!questionModel) return Responses.sendNotFoundResponse(response, "Question not found");

        // update question and return response
        await questionModel.merge({ question, answer }).save();

        return response.status(200).send(Responses.createResponse(questionModel.serialize({
            fields: { pick: ["question", "answer", "slug"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Question updated"));
    }

    /**
     * Archive question
     * @param request
     * @param auth
     * @param response
     * @param bouncer
     */
    public async archive({ request, auth, response, bouncer }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canWriteQuestion");
        if (!allows) return Responses.sendUnauthorizedResponse(response);


        // get slug from request
        const { slug } = request.only(["slug"]);
        const { unacrhive } = request.qs();

        // check if slug is not empty
        if (!slug || !slug.trim()) return Responses.sendInvalidRequestResponse(response, "Slug is required");

        // check if question exists
        const questionModel = await Question.findBy("slug", slug);
        if (!questionModel) return Responses.sendNotFoundResponse(response, "Question not found");

        // check for unarchive flag
        if (unacrhive) {
            await questionModel.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_DATA], "Question unarchived"));
        } else {
            await questionModel.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_DATA], "Question archived"));
        }
    }
}
