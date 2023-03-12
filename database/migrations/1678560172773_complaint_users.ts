import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'complaint_users';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');

            table.integer('created_by').unsigned().notNullable();
            table.integer('complaint_id').unsigned().notNullable();
            table.integer('on_behalf').unsigned().notNullable();
            table.integer('jansevak').unsigned().notNullable();
            table.timestamp('deleted_at').nullable();


            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
