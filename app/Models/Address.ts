import { DateTime } from "luxon";
import { BaseModel, belongsTo, column, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import Profile from "App/Models/Profile";

export default class Address extends BaseModel {


// export default class Address extends BaseModel {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column({ serializeAs: null })
    public profileId: number;

    @column()
    public addressLineOne: string;

    @column()
    public addressLineTwo: string;

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

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => Profile)
    public profile: BelongsTo<typeof Profile>;
}
