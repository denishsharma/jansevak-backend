import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import QueryCategoryFactory from "Database/factories/QueryCategoryFactory";

export default class extends BaseSeeder {
    public static environment = ["development", "testing", "production"];

    public async run() {
        await QueryCategoryFactory.createMany(10);
    }
}
