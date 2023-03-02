import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class ComplaintStatus extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public status: string;

    @column()
    public comment: string;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;


    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
