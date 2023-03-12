import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ComplaintUser from "App/Models/ComplaintUser";

export default class ComplaintUsersController {
    public async index({}: HttpContextContract) {
        return await ComplaintUser.all();

    }

    public async store({ request, response }: HttpContextContract) {
        const {
            created_by, complaint_id, on_behalf, jansevak
        } = request.only(['created_by', 'complaint_id', 'on_behalf', 'jansevak']);
        if (!created_by || !complaint_id || !on_behalf || !jansevak) {
            return response.status(404).json({ message: 'Complaint user not found' });
        }
        return await ComplaintUser.create({ created_by, complaint_id, on_behalf, jansevak });


    }

    public async show({ params }: HttpContextContract) {
        return await ComplaintUser.findOrFail(params.id);

    }

    public async update({}: HttpContextContract) {
    }

    public async destroy({}: HttpContextContract) {
    }
}
