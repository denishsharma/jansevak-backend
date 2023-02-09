import { DateTime } from "luxon";
import { BaseModel, computed, column, belongsTo, BelongsTo, hasOne, HasOne } from "@ioc:Adonis/Lucid/Orm";
import User from "App/Models/User";
import Address from "App/Models/Address";
import { string } from "@ioc:Adonis/Core/Helpers";

export default class Profile extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public userId: number;

    @column()
    public firstName: string | null;

    @column()
    public middleName: string | null;

    @column()
    public lastName: string | null;

    @column()
    public aadharNumber: string | null;

    @column()
    public panNumber: string | null;

    @column()
    public voterIdNumber: string | null;

    @column()
    public email: string | null;

    @column.dateTime()
    public birthDate: DateTime | null;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the user.
     * @type {BelongsTo<typeof User>}
     */
    @belongsTo(() => User)
    public user: BelongsTo<typeof User>;

    /**
     * Get the address.
     * @type {HasOne<typeof Address>}
     */
    @hasOne(() => Address)
    public address: HasOne<typeof Address>;

    @computed()
    public get fullName(): string {
        return string.condenseWhitespace(`${this.firstName} ${this.middleName} ${this.lastName}`);
    }

    @computed()
    public get initialsAndLastName(): string {
        return string.condenseWhitespace(`${this.firstName?.charAt(0)} ${this.middleName?.charAt(0)} ${this.lastName}`);
    }

}
