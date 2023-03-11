import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import axios from "axios";
import Responses, { ResponseCodes } from "App/Helpers/Responses";

export default class PostOfficesController {
    public async show({ params, response }: HttpContextContract) {
        const data = await axios.get(`https://api.postalpincode.in/pincode/${params.pincode}`, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
        });

        return response.status(200).json(Responses.createResponse(data.data, [ResponseCodes.SUCCESS_WITH_DATA], "Post Office Data"));
    }
}
