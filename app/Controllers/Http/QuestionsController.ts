import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Question from "App/Models/Question";

export default class QuestionsController {
    public async index({}: HttpContextContract) {
        return Question.all();
    }

    public async store({ request, response }: HttpContextContract) {
        // check if user is admin
        const { question, answer } = request.only(['question', 'answer']);
        // check if question and answer are not empty
        if (!question || !answer) {
            return response.status(404).json({ message: 'Question or answer not found' });
        }
        return await Question.create({ question, answer });
    }

    public async show({ params }: HttpContextContract) {

        return await Question.findOrFail(params.id);
    }

    public async update({ params, request, response }: HttpContextContract) {
        //check if user is admin
        const { question, answer } = request.only(['question', 'answer']);
        const que = await Question.findBy('id', params.id);
        //check if subject and content are not empty
        if (!que) {
            return response.status(404).json({ message: 'Question not found' });
        }
        que.merge({ question, answer });
        await que.save();
        return que;
    }

    public async destroy({ params }: HttpContextContract) {
        //check if user is admin
        const question = await Question.findBy('id', params.id);
        if (!question) {
            return { message: 'Question not found' };
        }
        await question.delete();
        return question;
    }

}
