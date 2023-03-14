import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { QueryStatuses } from "App/Helpers/Queries";

export default class extends BaseSchema {
    protected tableName = "queries";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.uuid("uuid").unique().notNullable().index();

            // Query ID for the external system
            table.string("fid").nullable().index().unique();

            // Query form data
            table.string("subject").notNullable();
            table.text("description", "longtext").nullable();

            // Query category
            table.bigInteger("query_category_id").unsigned().index();

            // Query status
            table.string("status").defaultTo(QueryStatuses.CREATED).index();


            table.timestamp("deleted_at").nullable();
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
