import { DateTime } from "luxon";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import Profile from "App/Models/Profile";

export default class Address extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public profileId: number;

    @column()
    public addressLine1: string;

    @column()
    public addressLine2: string;

    @column()
    public district: string;

    @column()
    public city: string;

    @column()
    public state: string;

    @column()
    public country: string;

    @column()
    public pincode: string;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => Profile)
    public profile: BelongsTo<typeof Profile>;
}
