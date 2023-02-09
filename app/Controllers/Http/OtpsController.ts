import Otp from "App/Models/Otp";
import { DateTime } from "luxon";
import User from "App/Models/User";

export default class OtpsController {
    public async generateOtp(user: User) {
        const otp_number = Math.floor(100000 + Math.random() * 900000);

        return await Otp.create({
            otp: otp_number.toString(),
            userId: user.id,
            expiresAt: DateTime.fromSeconds(DateTime.now().toSeconds()).plus({ minutes: 5 }),
        });
    }
}
