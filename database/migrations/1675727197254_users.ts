import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { UserTypes } from "App/Helpers/Authentication";

export default class extends BaseSchema {
    protected tableName = "users";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary();
            table.uuid("uuid").notNullable().unique();

            // User ID for the external system
            table.string("fid").nullable().index().unique();

            // authentication purposes
            table.string("phone_number", 255).nullable().unique();
            table.string("email", 255).nullable().unique();
            table.string("password", 180).nullable();
            table.string("remember_me_token").nullable();

            // Statuses & Types
            table.boolean("is_registered").defaultTo(false);
            table.boolean("is_archived").defaultTo(false);
            table.boolean("is_super_admin").defaultTo(false);
            table.boolean("is_setup_completed").nullable();
            table.boolean("is_verified").defaultTo(false).nullable();

            table.string("user_type").defaultTo(UserTypes.NAGRIK).nullable();

            table.timestamp("email_verified_at").nullable();
            table.timestamp("last_login_at").nullable();
            table.timestamp("registered_at").nullable();
            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
