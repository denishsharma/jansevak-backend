import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Ward from "App/Models/Ward";

export default class WardsController {
    public async index({}: HttpContextContract) {
        return Ward.all();
    }

    public async store({ request }: HttpContextContract) {
        // await auth.use('jwt').authenticate();

        const data = request.only(['name', 'code']);
        return await Ward.create(data);
    }

    public async update({ request }: HttpContextContract) {
        // await auth.use('jwt').authenticate();

        const data = request.only(['name', 'code']);
        const ward = await Ward.findOrFail(request.param('id'));
        ward.merge(data);
        await ward.save();

        return ward;
    }

    public async destroy({ request, response }: HttpContextContract) {
        // await auth.use('jwt').authenticate();

        const ward = await Ward.findOrFail(request.param('id'));
        await ward.delete();

        return response.status(200).send({ message: "Ward deleted successfully" });
    }
}
