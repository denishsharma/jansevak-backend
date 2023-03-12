import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Complaint from "App/Models/Complaint";

export default class ComplaintsController {
    public async index({}: HttpContextContract) {
        return await Complaint.all();
    }

    public async store({ request, response }: HttpContextContract) {
        const {
            subject, description, category_id, created_by, jansevak_id
        } = request.only(['subject', 'description', 'category_id', 'created_by', 'jansevak_id']);
        if (!subject || !description || !category_id || !created_by || !jansevak_id) {
            return response.status(404).json({ message: 'Complaint not found' });
        }
        return await Complaint.create({ subject, description, category_id, created_by, jansevak_id });
    }

    public async show({ params }: HttpContextContract) {
        return await Complaint.findOrFail(params.id);
    }

    public async update({ request, response, params }: HttpContextContract) {
        const complaint = await Complaint.findOrFail(params.id);
        const {
            subject, description, category_id, created_by, jansevak_id
        } = request.only(['subject', 'description', 'category_id', 'created_by', 'jansevak_id']);
        if (!subject || !description || !category_id || !created_by || !jansevak_id) {
            return response.status(404).json({ message: 'Complaint not found' });
        }
        complaint.subject = subject;
        complaint.description = description;
        complaint.category_id = category_id;
        complaint.created_by = created_by;
        complaint.jansevak_id = jansevak_id;
        await complaint.save();
        return complaint;

    }

    public async destroy({ params }: HttpContextContract) {
        const complaint = await Complaint.findOrFail(params.id);
        await complaint.delete();
        return complaint;

    }
}
