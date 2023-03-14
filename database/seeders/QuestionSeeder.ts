import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import QuestionFactory from "Database/factories/QuestionFactory";

export default class extends BaseSeeder {
    public static environment = ["development", "testing", "production"];

    public async run() {
        await QuestionFactory.createMany(10);
    }
}
