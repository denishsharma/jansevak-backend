import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import WardFactory from "Database/factories/WardFactory";

export default class extends BaseSeeder {
    public static environment = ["development", "testing", "production"];

    public async run() {
        await WardFactory.createMany(100);
    }
}
