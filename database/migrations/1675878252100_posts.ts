import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'posts';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('subject');
            table.text('content', 'longtext');
            table.json('attachments');

            table.timestamp('deleted_at').nullable();


            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
