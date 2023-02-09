import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'announcements';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');

            table.bigInteger('user_id').unsigned();
            table.string('subject');
            table.text('content', 'longtext');
            table.boolean('is_published').defaultTo(false);
            //Image
            //File


            table.timestamp('deleted_at').nullable();

            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
