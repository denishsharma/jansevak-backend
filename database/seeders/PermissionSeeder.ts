import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { getPermissions } from "App/Helpers/Permissions";
import Permission from "App/Models/Permission";

export default class extends BaseSeeder {
    public static environment = ["development", "testing", "production"];

    public async run() {
        const permissions = getPermissions();
        for (const [name, slug] of Object.entries(permissions)) {
            await Permission.create({ slug, name });
        }
    }
}
