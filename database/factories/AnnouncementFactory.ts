import Announcement from "App/Models/Announcement";
import Factory from "@ioc:Adonis/Lucid/Factory";

export default Factory.define(Announcement, () => {
    return {
        //
        // subject: faker.lorem.sentence(),
        // slug: faker.lorem.slug(),
        // content: faker.lorem.paragraph(),
    };
}).build();
