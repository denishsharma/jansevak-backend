import { DateTime } from "luxon";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { FeedbackTypes } from "App/Helpers/Feedbacks";
import User from "App/Models/User";

export default class Feedback extends BaseModel {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column({ serializeAs: null })
    public userId: number;

    @column({ serializeAs: null })
    public receiverId: number;

    @column({ serializeAs: null })
    public queryId: number;

    @column()
    public subject: string;

    @column()
    public text: string;

    @column()
    public rating: number;

    @column({ serialize: (value: string) => FeedbackTypes[value] })
    public type: FeedbackTypes;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => User, { foreignKey: "userId" })
    public user: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: "receiverId" })
    public receiver: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: "queryId" })
    public query: BelongsTo<typeof User>;
}
