import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Announcement from "App/Models/Announcement";

export default class AnnouncementsController {
    public async index({}: HttpContextContract) {
        return Announcement.all();
    }

    public async store({ request }: HttpContextContract) {
        //check if user is admin
        const { subject, content } = request.only(['subject', 'content']);
        //check if subject and content are not empty

        return await Announcement.create({ subject, content });
    }

    public async show({ params }: HttpContextContract) {

        // await auth.use('jwt').authenticate();
        return await Announcement.findOrFail(params.id);


    }

    public async update({ params, request, response }: HttpContextContract) {
        // check if user is admin
        const { subject, content } = request.only(['subject', 'content']);
        //check if subject and content are not empty
        const announcement = await Announcement.findBy('id', params.id);
        if (!announcement) {
            return response.status(404).json({ message: 'Announcement not found' });
        }
        announcement.merge({ subject, content });
        await announcement.save();
        return announcement;

    }

    public async destroy({ params }: HttpContextContract) {
        // check if user is admin
        const announcement = await Announcement.findBy('id', params.id);
        if (!announcement) {
            return { message: 'Announcement not found' };
        }
        await announcement.delete();
        return announcement;
    }


}
