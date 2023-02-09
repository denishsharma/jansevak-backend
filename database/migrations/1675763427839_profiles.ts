import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
    protected tableName = 'profiles';

    public async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string("user_id");
            table.string("first_name");
            table.string("last_name");
            table.string("phone");
            table.string("email");
            table.integer("address_id");
            table.string("gender");
            table.string("aadhar_card_number");
            table.string("voter_id_number");
            table.integer("ward_id").unsigned();

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
