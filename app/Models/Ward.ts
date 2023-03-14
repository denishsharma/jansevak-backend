import { DateTime } from "luxon";
import { BaseModel, column, hasMany, HasMany, hasManyThrough, HasManyThrough } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import User from "App/Models/User";
import Profile from "App/Models/Profile";

export default class Ward extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public name: string;

    @column()
    public code: string;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get all users.
     * @type {HasMany<typeof User>}
     */
    @hasMany(() => User)
    public users: HasMany<typeof User>;

    /**
     * Get all profiles through users.
     * @type {HasManyThrough<typeof Profile>}
     */
    @hasManyThrough([() => Profile, () => User])
    public profiles: HasManyThrough<typeof Profile>;
}
