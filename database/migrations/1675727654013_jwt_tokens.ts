import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class JwtTokens extends BaseSchema {
    protected tableName = "jwt_tokens";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary();
            table.integer("user_id").unsigned().references("id").inTable("").onDelete("CASCADE");
            table.string("name").notNullable();
            table.string("type").notNullable();
            table.string("token", 64).notNullable().unique();
            table.timestamp("expires_at").nullable();

            /** Generates the created_at and update_at columns */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
