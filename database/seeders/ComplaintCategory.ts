import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ComplaintCategoryFactory from 'Database/factories/ComplaintCategoryFactory';

export default class extends BaseSeeder {
    public async run() {
        await ComplaintCategoryFactory.createMany(10);

    }
}
