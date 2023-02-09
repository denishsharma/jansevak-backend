import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "profiles";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");
            table.integer("user_id").unsigned();

            table.string("first_name", 255).nullable();
            table.string("middle_name", 255).nullable();
            table.string("last_name", 255).nullable();

            table.string("aadhar_number", 255).nullable();
            table.string("pan_number", 255).nullable();
            table.string("voter_id_number", 255).nullable();

            table.string("phone_number", 255).nullable();
            table.string("email", 255).nullable();
            table.timestamp("birth_date").nullable();

            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
