import { DateTime } from 'luxon';
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm';
import { compose } from '@ioc:Adonis/Core/Helpers';
import { SoftDeletes } from '@ioc:Adonis/Addons/LucidSoftDeletes';
import Profile from "App/Models/Profile";

export default class Ward extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public name: string;

    @column()
    public code: number;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @hasMany(() => Profile)
    public profiles: HasMany<typeof Profile>;
}
