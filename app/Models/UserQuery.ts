import { DateTime } from "luxon";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import User from "App/Models/User";
import Query from "App/Models/Query";

export default class UserQuery extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column({ serializeAs: null })
    public queryId: number;

    @column({ serializeAs: null })
    public createdBy: number;

    @column({ serializeAs: null })
    public onBehalfOf: number;

    @column({ serializeAs: null })
    public forJansevak: number;

    @column.dateTime()
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the user that created the query.
     */
    @belongsTo(() => User, { foreignKey: "createdBy" })
    public createdByUser: BelongsTo<typeof User>;

    /**
     * Get the user that the query is on behalf of.
     */
    @belongsTo(() => User, { foreignKey: "onBehalfOf" })
    public onBehalfOfUser: BelongsTo<typeof User>;

    /**
     * Get the jansevak that the query is for.
     */
    @belongsTo(() => User, { foreignKey: "forJansevak" })
    public forJansevakUser: BelongsTo<typeof User>;

    /**
     * Get the query
     */
    @belongsTo(() => Query)
    public query: BelongsTo<typeof Query>;
}
