import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "user_queries";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.bigInteger("query_id").unsigned().index();

            // User relationship
            table.bigInteger("created_by").nullable().unsigned().index();
            table.bigInteger("on_behalf_of").nullable().unsigned().index();
            table.bigInteger("for_jansevak").nullable().unsigned().index();

            table.timestamp("deleted_at").nullable();
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
