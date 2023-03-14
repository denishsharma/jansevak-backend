import { DateTime } from "luxon";
import { BaseModel, column, beforeCreate, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { QueryCommentTypes, QueryStatuses } from "App/Helpers/Queries";
import { v4 as uuidv4 } from "uuid";
import Query from "App/Models/Query";
import User from "App/Models/User";

export default class QueryComment extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public uuid: string;

    @column({ serializeAs: null })
    public queryId: number;

    @column({ serialize: (value) => value && QueryCommentTypes[value] })
    public type: QueryCommentTypes;

    @column()
    public comment: string;

    @column({ serialize: (value) => value && QueryStatuses[value] })
    public status: QueryStatuses;

    @column({ serializeAs: null })
    public userId: number;

    @column.dateTime()
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the query that the query comment belongs to.
     */
    @belongsTo(() => Query)
    public query: BelongsTo<typeof Query>;

    /**
     * Get the user that the query comment belongs to.
     */
    @belongsTo(() => User)
    public user: BelongsTo<typeof User>;

    /**
     * Assign a UUID to the query comment before creating it.
     * @param queryComment
     */
    @beforeCreate()
    public static async generateUuid(queryComment: QueryComment) {
        queryComment.uuid = uuidv4();
    }
}
