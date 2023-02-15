import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "attachments";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.string("file_name");
            table.string("file_path");
            table.string("file_type");
            table.string("mime_type");

            table.string("client_name");

            table.integer("reference_id").unsigned();
            table.string("reference_type");

            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
