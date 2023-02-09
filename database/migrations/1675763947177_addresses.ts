import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'addresses';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string("street");
            table.string("city");
            table.string("state");
            table.bigInteger("zip");
            table.string("country");

            table.timestamp("deleted_at").nullable();

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
