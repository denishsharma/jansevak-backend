import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'wards';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string("name");
            table.string("code").notNullable().unique();

            table.timestamp("deleted_at").nullable();

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
