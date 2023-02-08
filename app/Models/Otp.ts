import { DateTime } from "luxon";
import { belongsTo, BelongsTo, BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import User from "App/Models/User";

export default class Otp extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public otp: string;

    @column()
    public userId: number;

    @column.dateTime()
    public expiresAt: DateTime;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => User)
    public user: BelongsTo<typeof User>;
}
