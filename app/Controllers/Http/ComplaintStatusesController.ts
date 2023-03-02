import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ComplaintStatus from "App/Models/ComplaintStatus";

export default class ComplaintStatusesController {

    public async index({}: HttpContextContract) {
        return await ComplaintStatus.all();
    }

    public async store({ request }: HttpContextContract) {
        //check if user is loged in
        const { comment, status } = request.only(['comment', 'status']);
        //check if comment is not empty
        if (!comment) {
            return { message: 'Comment not found' };
        }

        return await ComplaintStatus.create({ comment, status });

    }

    public async show({ params }: HttpContextContract) {
        //check if user is loged in
        return await ComplaintStatus.findOrFail(params.id);
    }

    public async update({ request, params }: HttpContextContract) {
        //check if user is loged in
        //check if user is admin or has permission to change the status
        const { comment, status } = request.only(['comment', 'status']);
        const complaintStatus = await ComplaintStatus.findBy('id', params.id);
        //check if comment and status are not empty
        if (!complaintStatus) {
            return { message: 'Complaint status not found' };
        }
        complaintStatus.merge({ comment, status });
        await complaintStatus.save();

        return complaintStatus;

    }

    public async destroy({}: HttpContextContract) {
        //
    }

}
