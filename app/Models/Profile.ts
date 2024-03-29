import { DateTime } from "luxon";
import { BaseModel, computed, column, belongsTo, BelongsTo, hasOne, HasOne } from "@ioc:Adonis/Lucid/Orm";
import User from "App/Models/User";
import Address from "App/Models/Address";
import { string } from "@ioc:Adonis/Core/Helpers";
import { createHash } from "crypto";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import Attachment from "App/Models/Attachment";

export default class Profile extends BaseModel {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column({ serializeAs: null })
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
    public phoneNumber: string | null;

    @column()
    public gender: string | null;

    @column()
    public email: string | null;

    @column({ serializeAs: null })
    public avatar: string | null;

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

    /**
     * Get the full name.
     */
    @computed({ serializeAs: "full_name" })
    public get fullName(): string {
        if (!this.firstName && !this.middleName && !this.lastName) return "";
        return string.condenseWhitespace(`${this.firstName}${this.middleName ? " " + this.middleName : ""}${this.lastName ? " " + this.lastName : ""}`);
    }

    /**
     * Get the initials and last name.
     */
    @computed({ serializeAs: "initials_and_last_name" })
    public get initialsAndLastName(): string {
        if (!this.firstName && !this.middleName && !this.lastName) return "";
        return string.condenseWhitespace(`${this.firstName?.charAt(0)} ${this.middleName?.charAt(0) ? this.middleName?.charAt(0) + " " : ""}${this.lastName ? this.lastName : ""}`);
    }

    /**
     * Get url of the avatar.
     */
    @computed({ serializeAs: "avatar_url" })
    public get avatarUrl(): string {
        if (!this.avatar || !this.avatar.trim()) {
            if (!this.firstName && !this.lastName) return "https://api.dicebear.com/5.x/shapes/png?backgroundType=gradientLinear&size=128&seed=" + createHash("shake256", { outputLength: 8 }).update(this.id.toString()).digest("hex");
            return "https://ui-avatars.com/api/?background=2563eb&color=fff&size=128&name=" + this.firstName?.charAt(0) + "+" + this.lastName?.charAt(0);
        }

        return this.avatar;
    }

    public async getAvatarAttachment() {
        return await Attachment.query().where("reference_type", PolymorphicType.Profile).where("reference_id", this.id).first();
    }

}
