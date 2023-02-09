import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "wards";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.string("name").notNullable();
            table.string("code").notNullable().unique().index();

            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
