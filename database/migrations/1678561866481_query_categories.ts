import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "query_categories";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.uuid("uuid").unique().notNullable().index();

            table.string("name").notNullable();
            table.text("description", "longtext").nullable();

            table.dateTime("archive_at").nullable();
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
