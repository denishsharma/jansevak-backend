import question from 'App/Models/question';
import Factory from '@ioc:Adonis/Lucid/Factory';

export default Factory.define(question, ({ faker }) => {
    return {
        question: faker.lorem.sentence(),
        answer: faker.lorem.paragraph(),
    };
}).build();
