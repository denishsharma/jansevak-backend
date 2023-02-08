import { JobContract } from "@ioc:Rocketseat/Bull";
import Profile from "App/Models/Profile";
import Address from "App/Models/Address";
import console from "console";
import User from "App/Models/User";

/*
|--------------------------------------------------------------------------
| Job setup
|--------------------------------------------------------------------------
|
| This is the basic setup for creating a job, but you can override
| some settings.
|
| You can get more details by looking at the bullmq documentation.
| https://docs.bullmq.io/
*/

export default class CreateProfileJob implements JobContract {
    public key = "CreateProfileJob";

    public async handle(job) {
        const { data } = job;

        // Create user profile and address
        const profile = await Profile.create({
            userId: data.id,
            email: data.email,
            phoneNumber: data.phoneNumber,
        });

        await Address.create({
            profileId: profile.id,
        });

        // Check if profile is created
        if (profile && profile.id === data.id) {
            const user = await User.find(data.id);
            await user?.merge({ isSetupCompleted: false });

            console.log("User profile created");
        }
    }
}
