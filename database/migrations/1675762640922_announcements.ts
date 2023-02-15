import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "announcements";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.integer("user_id").unsigned();

            table.string("subject");
            table.text("content", "longtext");
            table.string("slug").unique().notNullable();

            table.boolean("is_published").defaultTo(false);

            table.timestamp("published_at").nullable();
            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
