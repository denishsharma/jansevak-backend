import { DateTime } from 'luxon';
import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm';
import User from "App/Models/User";
import ComplaintCategory from "App/Models/ComplaintCategory";

export default class Complaint extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public subject: string;

    @column()
    public description: string;

    @column()
    public category_id: number;

    @column()
    public created_by: number;

    @column()
    public jansevak_id: number;

    @belongsTo(() => User, { foreignKey: 'created_by' })
    public user: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: 'jansevak_id' })
    public jansevak: BelongsTo<typeof User>;

    @belongsTo(() => ComplaintCategory, { foreignKey: 'category_id' })
    public category: BelongsTo<typeof ComplaintCategory>;


    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
