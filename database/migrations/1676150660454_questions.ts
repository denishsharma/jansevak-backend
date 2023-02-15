import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "questions";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.string("slug").notNullable().unique();

            table.string("question").notNullable();
            table.text("answer", "longtext").notNullable();

            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
