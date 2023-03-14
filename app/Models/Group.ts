import { DateTime } from "luxon";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { BaseModel, column, manyToMany, ManyToMany, beforeCreate, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { GroupTypes } from "App/Helpers/Groups";
import User from "App/Models/User";
import { v4 as uuidv4 } from "uuid";

export default class Group extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public name: string;

    @column()
    public description: string;

    @column({ serialize: (value) => value && GroupTypes[value] })
    public type: GroupTypes;

    @column({ serializeAs: null })
    public userId: number;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => User, { foreignKey: "userId" })
    public createdBy: BelongsTo<typeof User>;

    /**
     * Get all users.
     */
    @manyToMany(() => User, {
        pivotTable: "group_user",
        pivotColumns: ["added_by"],
    })
    public users: ManyToMany<typeof User>;

    @beforeCreate()
    public static async generateUuid(group: Group) {
        group.uuid = uuidv4();
    }
}
