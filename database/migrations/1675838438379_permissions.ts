import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "permissions";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.uuid("uuid").unique().notNullable();

            table.string("name", 255).unique();
            table.string("slug", 255).nullable().unique();
            table.text("description").nullable();

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
