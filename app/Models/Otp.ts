import { DateTime } from "luxon";
import { belongsTo, BelongsTo, BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import User from "App/Models/User";
import { OtpTypes } from "App/Helpers/Authentication";

export default class Otp extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public otp: string;

    @column()
    public userId: number;

    @column()
    public phoneNumber: string | null;

    @column({ serialize: (value: OtpTypes) => value && OtpTypes[value] })
    public type: OtpTypes;

    @column()
    public payload: string | null;

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


    /**
     * Check if the otp is expired
     */
    public isExpired() {
        return this.expiresAt < DateTime.now();
    }
}
