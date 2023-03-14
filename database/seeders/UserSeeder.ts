import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import User from "App/Models/User";
import { UserTypes, UserVerificationStatuses } from "App/Helpers/Authentication";
import { DateTime } from "luxon";
import Ward from "App/Models/Ward";
import { faker } from "@faker-js/faker";
import { GroupTypes } from "App/Helpers/Groups";

export default class extends BaseSeeder {
    public static environment = ["development", "testing"];

    public async run() {
        // create 1 admin
        await this.createUser(UserTypes.ADMIN);

        // create 20 Jansevak
        for (let i = 0; i < 10; i++) {
            await this.createUser(UserTypes.JANSEVAK);
        }

        // create 100 Nagarik
        for (let i = 0; i < 100; i++) {
            await this.createUser(UserTypes.NAGRIK);
        }
    }

    private async createUser(userType: UserTypes) {
        const _gender: "male" | "female" = faker.helpers.arrayElement(["male", "female"]);
        const _firstName = faker.name.firstName(_gender);
        const _lastName = faker.name.lastName();

        // create new user
        const newUser = await User.create({
            phoneNumber: faker.phone.number("##########"),
            userType: userType,
            isRegistered: true,
            isSetupCompleted: true,
            isVerified: true,
            registeredAt: DateTime.now(),
        });

        // create  profile
        const newProfile = await newUser.related("profile").create({
            firstName: _firstName,
            lastName: _lastName,
            gender: _gender,
            email: faker.internet.email(_firstName, _lastName),
        });

        // create profile address
        await newProfile.related("address").create({
            addressLineOne: faker.address.streetAddress(),
            pincode: faker.address.zipCode("######"),
            district: faker.address.cityName(),
            city: faker.address.city(),
            state: faker.address.state(),
            country: "IN",
        });

        let allottedJansevak: User | null = null;
        let wardId: number | undefined;
        if (userType === UserTypes.NAGRIK) {
            allottedJansevak = await User.query().where("user_type", UserTypes.JANSEVAK).where("id", Math.floor(Math.random() * 10) + 1).first();
            await allottedJansevak?.load("allocation");
            wardId = allottedJansevak?.allocation?.wardId;
        } else {
            wardId = await Ward.query().where("id", Math.floor(Math.random() * 10) + 1).first().then((ward) => ward?.id);
        }

        // create user allocation
        await newUser.related("allocation").create({
            wardId: wardId,
            allocatedTo: allottedJansevak?.id,
            verifiedBy: allottedJansevak?.id || 1,
            createdBy: allottedJansevak?.id || 1,
            verification: UserVerificationStatuses.VERIFIED,
            verifiedAt: DateTime.now(),
        });

        // create family group
        await newUser.related("familyGroup").create({
            name: `${newProfile.fullName}'s Family`,
            type: GroupTypes.FAMILY,
        });
    }
}
