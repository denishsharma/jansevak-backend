import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import User from "App/Models/User";
import Family from "App/Models/Family";

export default class FamiliesController {
    public async addMember({ request, response }: HttpContextContract) {
        const assigner = request.input('assigner_uuid');
        const assignee = request.input('assignee_uuid');

        const member = new Family();
        member.assigner_id = assigner;
        member.assignee_id = assignee;

        const assigner_user = await User.findBy('uuid', assigner);

        if (assigner_user.userType === 'nagrik') {
            await member.save();
        } else {
            response.status(400).json({
                message: 'Jansevak can not add family members'
            });
        }
    }

    public async removeMember({ request, response }: HttpContextContract) {
        const assigner = request.input('assigner_uuid');
        const assignee = request.input('assignee_uuid');

        const assignerType = await User.findBy('uuid', assigner);

        const member = await Family.findBy('assignee_id', assignee);
        // console.log(member);

        if (member.assigner_id === assigner && assignerType.userType === 'nagrik') {
            await member.delete();
            response.status(200).json({
                message: 'Member removed successfully'
            });
        } else {
            response.status(400).json({
                message: 'User must be a family member of user'
            });
        }
    }

    public async updateMember({ request, response }: HttpContextContract) {
        const assigner = request.input('assigner_uuid');
        const assignee = request.input('assignee_uuid');

        const assigner_user = await User.findBy('uuid', assigner);
        const { email, phone_number } = request.only(['email', 'phone_number']);

        const assignee_user = await User.findBy('uuid', assignee);
        assignee_user.email = email;
        assignee_user.phone_number = phone_number;

        const member = await Family.findBy('assignee_id', assignee);
        console.log(member);

        if (member.assigner_id === assigner && assigner_user.userType === 'nagrik') {
            await assignee_user.save();
            response.status(200).json({
                message: 'Family Member updated successfully'
            });
        } else {
            response.status(400).json({
                message: 'User must be a family member of user'
            });
        }
    }

    public async assignMember({ request, response }: HttpContextContract) {
        const assigner = request.input('assigner_uuid');
        const assignee = request.input('assignee_uuid');

        const member = new Family();
        member.assigner_id = assigner;
        member.assignee_id = assignee;

        const assigner_user = await User.findBy('uuid', assigner);


        if (assigner_user.userType === 'jansevak' || assigner_user.userType === 'admin') {
            await member.save();
        } else {
            response.status(400).json({
                message: 'Only Jansevak can add members'
            });
        }
    }


}
