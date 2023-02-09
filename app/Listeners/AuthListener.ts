import type { EventsList } from "@ioc:Adonis/Core/Event";
import Bull from "@ioc:Rocketseat/Bull";
import SentOtp from "App/Jobs/SentOtpJob";

export default class AuthListener {

    /**
     * Listener for OTP generation event
     * @param {EventsList["otp:generated"]} data
     * @returns {Promise<void>}
     */
    public async onOtpGenerated(data: EventsList["otp:generated"]) {
        // Send OTP to the user
        Bull.add(new SentOtp().key, data, { attempts: 3 });
    }
}
