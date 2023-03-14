import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "addresses";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.integer("profile_id").unsigned();

            table.string("address_line_one", 255).nullable();
            table.string("address_line_two", 255).nullable();
            table.string("district", 255).nullable();
            table.string("city", 255).nullable();
            table.string("state", 255).nullable();
            table.string("country", 255).nullable();
            table.string("pincode", 255).nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
