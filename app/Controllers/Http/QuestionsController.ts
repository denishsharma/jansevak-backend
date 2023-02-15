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

        if (!questions || questions.length < 1) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Questions not found"));
        }

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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to create question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canCreateQuestion");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get question and answer from request
        const { question, answer } = request.only(["question", "answer"]);

        // check if question and answer are not empty
        if (!question || !answer) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

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
     * Get question by slug
     * @param params
     * @param response
     */
    public async show({ params, response }: HttpContextContract) {
        // check if slug is not empty
        const { slug } = params;

        if (!slug) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // get question by slug
        const question = await Question.findBy("slug", params.slug);

        // check if question exists
        if (!question) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Question not found"));
        }

        return response.status(200).send(Responses.createResponse(question.serialize({
            fields: { pick: ["question", "answer", "slug"] },
        }), [ResponseCodes.SUCCESS_WITH_DATA], "Question found"));
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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to update question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canUpdateQuestion");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get question, answer and slug from request
        const { question, answer, slug } = request.only(["question", "answer", "slug"]);

        // check if slug is not empty
        if (!slug) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // check if question and answer are not empty
        const questionModel = await Question.findBy("slug", slug);

        if (!questionModel) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Question not found"));
        }

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

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to archive question
        const allows = await bouncer.forUser(user).with("QuestionPolicy").allows("canUpdateQuestion");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get slug from request
        const { slug, is_archived } = request.only(["slug", "is_archived"]);

        // check if slug is not empty
        if (!slug || is_archived === undefined) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // check if question exists
        const question = await Question.withTrashed().where("slug", slug).first();

        if (!question) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Question not found"));
        }

        // check if question is already archived
        const questionIsAlreadyArchived = question.deletedAt !== null;

        if (questionIsAlreadyArchived && is_archived) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Question is already archived"));
        } else if (!questionIsAlreadyArchived && !is_archived) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Question is not archived"));
        }

        // archive or restore question
        if (is_archived && !questionIsAlreadyArchived) {
            await question.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Question archived"));
        } else if (!is_archived && questionIsAlreadyArchived) {
            await question.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Question restored"));
        }
    }

}
