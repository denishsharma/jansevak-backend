import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { SoftDeletes } from '@ioc:Adonis/Addons/LucidSoftDeletes';
import { compose } from '@ioc:Adonis/Core/Helpers';


export default class Announcement extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public subject: string;

    @column()
    public content: string;

    @column.dateTime({ columnName: 'deleted_at' })
    public deletedAt: DateTime | null;


    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;


    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
