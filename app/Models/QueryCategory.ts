import { DateTime } from "luxon";
import { BaseModel, column, beforeCreate, hasMany, HasMany } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuidv4 } from "uuid";
import Query from "App/Models/Query";

export default class QueryCategory extends BaseModel {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public name: string;

    @column()
    public description: string;

    @column.dateTime()
    public archiveAt: DateTime | null;

    @column.dateTime({ autoCreate: true, serializeAs: null })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
    public updatedAt: DateTime;

    /**
     * Get the queries that belong to the query category.
     */
    @hasMany(() => Query)
    public queries: HasMany<typeof Query>;

    /**
     * Assign a UUID to the query category before creating it.
     * @param queryCategory
     */
    @beforeCreate()
    public static assignUuid(queryCategory: QueryCategory) {
        queryCategory.uuid = uuidv4();
    }
}
