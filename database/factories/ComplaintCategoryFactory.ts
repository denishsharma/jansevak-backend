import ComplaintCategory from 'App/Models/ComplaintCategory';
import Factory from '@ioc:Adonis/Lucid/Factory';

export default Factory.define(ComplaintCategory, ({ faker }) => {
    return {
        category: faker.lorem.sentence(),
    };
}).build();
