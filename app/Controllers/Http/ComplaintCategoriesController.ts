import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ComplaintCategory from "App/Models/ComplaintCategory";


export default class ComplaintCategoriesController {
    public async index({}: HttpContextContract) {
        return await ComplaintCategory.all();
    }

    public async store({ request, response }: HttpContextContract) {
        const { category } = request.only(['category']);
        if (!category) {
            return response.status(404).json({ message: 'Category not found' });
        }
        return await ComplaintCategory.create({ category });


    }

    public async show({ params }: HttpContextContract) {
        return await ComplaintCategory.findOrFail(params.id);

    }


    public async update({ request, response, params }: HttpContextContract) {
        const { category } = request.only(['category']);
        const complaintCategory = await ComplaintCategory.findBy('id', params.id);
        if (!complaintCategory) {
            return response.status(404).json({ message: 'Complaint category not found' });
        }
        complaintCategory.merge({ category });
        await complaintCategory.save();
        return complaintCategory;
    }

    public async destroy({ params }: HttpContextContract) {
        const complaintCategory = await ComplaintCategory.findBy('id', params.id);
        if (!complaintCategory) {
            return { message: 'Complaint category not found' };
        }
        await complaintCategory.delete();
        return complaintCategory;
    }

}
