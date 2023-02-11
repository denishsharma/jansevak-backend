import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class Complaint extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public subject: string;

    @column()
    public description: string;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
