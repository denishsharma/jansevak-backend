import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ComplaintFactory from 'Database/factories/ComplaintFactory';

export default class extends BaseSeeder {
    public async run() {
        await ComplaintFactory.createMany(10);
    }
}
