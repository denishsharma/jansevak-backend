import question from "App/Models/question";
import Factory from "@ioc:Adonis/Lucid/Factory";

export default Factory.define(question, ({ faker }) => {
    return {
        slug: faker.lorem.slug(),
        question: faker.lorem.sentence(),
        answer: faker.lorem.paragraph(),
    };
}).build();
