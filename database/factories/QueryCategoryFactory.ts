import QueryCategory from "App/Models/QueryCategory";
import Factory from "@ioc:Adonis/Lucid/Factory";

export default Factory.define(QueryCategory, ({ faker }) => {
    return {
        name: faker.name.jobTitle(),
        description: faker.lorem.paragraph(),
    };
}).build();
