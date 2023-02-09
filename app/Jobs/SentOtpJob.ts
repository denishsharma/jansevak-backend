import { JobContract } from "@ioc:Rocketseat/Bull";
import * as console from "console";

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

export default class SentOtpJob implements JobContract {
    public key = "SentOtpJob";

    public async handle(job) {
        const { data } = job;
        // Do something with you job data

        console.log(data);
    }
}
