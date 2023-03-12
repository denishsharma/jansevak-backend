import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ComplaintUserFactory from "Database/factories/ComplaintUserFactory";

export default class extends BaseSeeder {
    public async run() {
        // Write your database queries inside the run method
        await ComplaintUserFactory.createMany(10);
    }
}
