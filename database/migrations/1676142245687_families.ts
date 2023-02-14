import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'families';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('assigner_id', 255).notNullable();
            table.string('assignee_id', 255).notNullable();
            table.timestamp("deleted_at").nullable();
            /**
             * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
             */
            table.timestamps(true, true);
        });
    }

    public async down() {
        this.schema.dropTable(this.tableName);
    }
}
