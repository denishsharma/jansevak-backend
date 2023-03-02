import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { GroupTypes } from "App/Helpers/Groups";

export default class extends BaseSchema {
    protected tableName = "groups";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.uuid("uuid").unique().notNullable();

            table.integer("user_id").unsigned().notNullable().index();

            table.string("name", 255).notNullable();
            table.string("description", 255).nullable();

            table.string("type", 255).nullable().defaultTo(GroupTypes.GENERAL);

            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
