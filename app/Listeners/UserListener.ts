import type { EventsList } from "@ioc:Adonis/Core/Event";
import Bull from "@ioc:Rocketseat/Bull";
import CreateProfileJob from "App/Jobs/CreateProfileJob";

export default class UserListener {
    /**
     * Listener for user creation event
     * @param {EventsList["user:created"]} data
     * @returns {Promise<void>}
     */
    public async onUserCreated(data: EventsList["user:created"]) {
        Bull.add(new CreateProfileJob().key, data, { attempts: 3 });
    }
}
