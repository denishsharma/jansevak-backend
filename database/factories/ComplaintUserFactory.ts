import complaint_users from 'App/Models/ComplaintUser';
import Factory from '@ioc:Adonis/Lucid/Factory';

export default Factory.define(complaint_users, ({ faker }) => {
    return {
        created_by: faker.random.numeric(),
        complaint_id: faker.random.numeric(),
        on_behalf: faker.random.numeric(),
        jansevak: faker.random.numeric(),

    };
}).build();
