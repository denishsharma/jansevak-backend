import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { QueryCommentTypes } from "App/Helpers/Queries";

export default class extends BaseSchema {
    protected tableName = "query_comments";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.uuid("uuid").unique().notNullable();

            // comment for the query
            table.bigInteger("query_id").unsigned().index();

            // comment data
            table.string("type").defaultTo(QueryCommentTypes.COMMENT).nullable();
            table.text("comment").nullable();
            table.string("status").nullable();

            // comment author
            table.bigInteger("user_id").unsigned().index().nullable();

            table.timestamp("deleted_at").nullable();
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
