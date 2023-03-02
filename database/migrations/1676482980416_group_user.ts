import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "group_user";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.integer("user_id").unsigned();
            table.integer("group_id").unsigned();
            table.integer("added_by").unsigned();

            table.index(["user_id", "group_id", "added_by"]);

            table.index(["user_id", "group_id"]);

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
