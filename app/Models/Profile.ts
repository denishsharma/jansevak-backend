import { DateTime } from 'luxon';
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm';
import { compose } from '@ioc:Adonis/Core/Helpers';
import { SoftDeletes } from '@ioc:Adonis/Addons/LucidSoftDeletes';
import Address from "App/Models/Address";
import Ward from "App/Models/Ward";


export default class Profile extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public user_id: string;

    @column()
    public first_name: string;


    @column()
    public last_name: string;

    @column()
    public phone: string;

    @column()
    public address_id: number;

    @column()
    public gender: string;

    @column()
    public aadhar_card_number: string;

    @column()
    public voter_id_number: string;

    @column()
    public email: string;

    @column()
    public ward_id: number;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;


    @hasOne(() => Address)
    public address: HasOne<typeof Address>;

    @hasOne(() => Ward)
    public ward: HasOne<typeof Ward>;

}
