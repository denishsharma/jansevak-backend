import Ward from "App/Models/Ward";
import Factory from "@ioc:Adonis/Lucid/Factory";

export default Factory.define(Ward, ({ faker }) => {
    return {
        name: faker.address.city(),
        code: faker.address.zipCode() + faker.random.numeric(5),
    };
}).build();
