import { DateTime } from "luxon";
import { BaseModel, beforeCreate, column, manyToMany, ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import User from "App/Models/User";
import { v4 as uuidv4 } from "uuid";

export default class Permission extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public slug: string;

    @column()
    public name: string;

    @column()
    public description: string;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @manyToMany(() => User, {
        pivotTable: "permission_user",
    })
    public users: ManyToMany<typeof User>;

    @beforeCreate()
    public static async generateUuid(permission: Permission) {
        permission.uuid = uuidv4();
    }
}
