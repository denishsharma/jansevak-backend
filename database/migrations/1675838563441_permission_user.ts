import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "permission_user";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            table.integer("user_id").unsigned();
            table.integer("permission_id").unsigned();
            table.index(["user_id", "permission_id"]);

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
