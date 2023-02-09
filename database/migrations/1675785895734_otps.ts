import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "otps";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.string("otp", 255).notNullable();
            table.bigInteger("user_id").unsigned();

            table.timestamp("expires_at").notNullable();
            table.timestamp("deleted_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
