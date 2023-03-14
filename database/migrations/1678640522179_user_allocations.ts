import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { UserVerificationStatuses } from "App/Helpers/Authentication";

export default class extends BaseSchema {
    protected tableName = "user_allocations";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.bigInteger("user_id").unsigned().index();
            table.bigInteger("ward_id").nullable().unsigned().index(); // ward id of the user (if any)
            table.bigInteger("allocated_to").nullable().unsigned().index(); // jansevak user id
            table.bigInteger("verified_by").nullable().unsigned().index(); // who verified the user
            table.bigInteger("created_by").nullable().unsigned().index(); // who created the user

            table.string("verification").defaultTo(UserVerificationStatuses.PENDING).nullable();

            table.timestamp("verified_at").nullable();
            table.timestamp("deleted_at").nullable();
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
