import Complaint from 'App/Models/Complaint';
import Factory from '@ioc:Adonis/Lucid/Factory';

export default Factory.define(Complaint, ({ faker }) => {
    return {
        subject: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(),

    };
}).build();
