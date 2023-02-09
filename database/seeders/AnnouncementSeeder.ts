import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import AnnouncementFactory from "Database/factories/AnnouncementFactory";

export default class extends BaseSeeder {
    public async run() {
        await AnnouncementFactory.createMany(10);
    }
}
