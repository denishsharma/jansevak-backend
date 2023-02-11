import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Complaint from "App/Models/Complaint";

export default class ComplaintsController {
    public async index({}: HttpContextContract) {
        return await Complaint.all();
    }

    public async store({ request, response }: HttpContextContract) {
        //check if user is loged in

        //check if user has permission to create complaint
        const { subject, description } = request.only(['subject', 'description']);
        //check if subject and content are not empty
        if (!subject || !description) {
            return response.status(404).json({ message: 'Title or content not found' });
        }

        return await Complaint.create({ subject, description });

    }

    public async show({ params }: HttpContextContract) {
        //check if user is loged in
        return await Complaint.findOrFail(params.id);
    }

    public async update({ params, request, response }: HttpContextContract) {
        //check if user is loged in
        //check if user is admin
        const { subject, description } = request.only(['subject', 'description']);
        const complaint = await Complaint.findBy('id', params.id);
        //check if subject and content are not empty
        if (!complaint) {
            return response.status(404).json({ message: 'Complaint not found' });
        }
        complaint.merge({ subject, description });
        await complaint.save();
        return complaint;
    }

    public async destroy({ params }: HttpContextContract) {
        //check if user is loged in
        //check if user is admin
        const complaint = await Complaint.findBy('id', params.id);
        if (!complaint) {
            return { message: 'Complaint not found' };
        }
        await complaint.delete();
        return complaint;
    }
}
