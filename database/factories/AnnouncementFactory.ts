import Announcement from 'App/Models/Announcement';
import Factory from '@ioc:Adonis/Lucid/Factory';

export default Factory.define(Announcement, ({ faker }) => {
    return {
        subject: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
    };
}).build();
