import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm';
import User from "App/Models/User";
import Complaint from "App/Models/Complaint";

export default class ComplaintUser extends BaseModel {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public created_by: number;

    @column()
    public complaint_id: number;

    @column()
    public on_behalf: number;

    @column()
    public jansevak: number;

    @belongsTo(() => User, { foreignKey: 'created_by' })
    public user: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: 'on_behalf' })
    public onBehalf: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: 'jansevak' })
    public jansevakUser: BelongsTo<typeof User>;

    @belongsTo(() => Complaint, { foreignKey: 'complaint_id' })
    public complaint: BelongsTo<typeof Complaint>;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
