// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Profile from "App/Models/Profile";
import Address from "App/Models/Address";
import Ward from "App/Models/Ward";

export default class ProfilesController {
    public async index({}: HttpContextContract) {
        return Profile.all();
    }

    public async store({ request }: HttpContextContract) {
        const addressData = request.only(['street', 'city', 'state', 'zip', 'country']);
        const address = await Address.create(addressData);

        const wardData = request.only(['ward']);
        const ward = await Ward.findBy('code', wardData.ward);


        const profileData = request.only(['user_id', 'first_name', 'last_name', 'phone', 'gender', 'aadhar_card_number', 'voter_id_number', 'email']);
        // return await Profile.create({
        //     ...profileData,
        // });

        if (!ward) {
            return {
                message: "Ward not found"
            };
        }

        const profile = await Profile.create({
            address_id: address.id,
            ward_id: ward.id,
            user_id: profileData.user_id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            gender: profileData.gender,
            aadhar_card_number: profileData.aadhar_card_number,
            voter_id_number: profileData.voter_id_number,
            email: profileData.email,
        });

        return profile;

    }

    public async update({ request }: HttpContextContract) {

        const profileData = request.only(['user_id', 'first_name', 'last_name', 'phone', 'gender', 'aadhar_card_number', 'voter_id_number', 'email']);
        const profile = await Profile.findOrFail(request.param('id'));
        profile.merge(profileData);
        await profile.save();


        const addressData = request.only(['street', 'city', 'state', 'zip', 'country']);
        const address = await Address.findOrFail(profile.address_id);
        address.merge(addressData);
        await address.save();

        return profile;
    }

    public async destroy({ request, response }: HttpContextContract) {
        const profile = await Profile.findOrFail(request.param('id'));
        const address = await Address.findOrFail(profile.address_id);
        await profile.delete();
        await address.delete();

        return response.status(200).send({ message: "Profile deleted successfully" });
    }
}
