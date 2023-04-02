import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
    protected tableName = "feedbacks";

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id");

            // who is giving feedback
            table.bigInteger("user_id").unsigned().nullable();
            // who is receiving feedback
            table.bigInteger("receiver_id").unsigned().nullable();
            // feedback for which query (if any)
            table.bigInteger("query_id").unsigned().nullable();

            // feedback subject and text
            table.string("subject").nullable();
            table.text("text", "longtext").nullable();
            // feedback rating
            table.integer("rating").nullable();

            // feedback type
            table.string("type").nullable().defaultTo("feedback");

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
