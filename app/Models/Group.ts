import { DateTime } from "luxon";
import { BaseModel, column, manyToMany, ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import { GroupTypes } from "App/Helpers/Groups";
import User from "App/Models/User";

export default class Group extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public name: string;

    @column()
    public description: string;

    @column({ serialize: (value) => value && GroupTypes[value] })
    public type: GroupTypes;

    @column()
    public userId: number;

    @column()
    public createdBy: number;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get all users.
     */
    @manyToMany(() => User, {
        pivotTable: "group_user",
        pivotColumns: ["added_by"],
    })
    public users: ManyToMany<typeof User>;
}
