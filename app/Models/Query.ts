import { DateTime } from "luxon";
import { BaseModel, column, beforeCreate, belongsTo, BelongsTo, hasMany, HasMany, hasOne, HasOne } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import QueryCategory from "App/Models/QueryCategory";
import { v4 as uuidv4 } from "uuid";
import { QueryStatuses } from "App/Helpers/Queries";
import QueryComment from "App/Models/QueryComment";
import UserQuery from "App/Models/UserQuery";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import Drive from "@ioc:Adonis/Core/Drive";

export default class Query extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public fid: string;

    @column()
    public subject: string;

    @column()
    public description: string;

    @column({ serializeAs: null })
    public queryCategoryId: number;

    @column({ serialize: (value) => value && QueryStatuses[value] })
    public status: QueryStatuses;

    @column.dateTime()
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the query category that the query belongs to.
     * @returns BelongsTo<QueryCategory>
     */
    @belongsTo(() => QueryCategory)
    public queryCategory: BelongsTo<typeof QueryCategory>;

    /**
     * Get the query comments that belong to the query.
     */
    @hasMany(() => QueryComment)
    public queryComments: HasMany<typeof QueryComment>;

    @hasOne(() => UserQuery)
    public userRelation: HasOne<typeof UserQuery>;

    /**
     * Assign a UUID to the query before creating it.
     */
    @beforeCreate()
    public static assignUuid(query: Query) {
        query.uuid = uuidv4();
    }

    @beforeCreate()
    public static assignFid(query: Query) {
        query.fid = String(Math.floor(Math.random() * 100000000));
    }

    public async getAttachmentsCount() {
        const attachments = await this.getAttachments();
        return attachments.length;
    }

    /**
     * Get the attachments' URLs.
     */
    public async getAttachmentsUrl() {
        // Get the attachments.
        const attachments = await this.getAttachments();

        // If there are no attachments, return an empty array.
        if (!attachments || attachments.length === 0) return [];

        // Return the attachments' URLs.
        return await Promise.all(attachments.map(async (attachment) => ({
            url: await Drive.getSignedUrl(attachment.fileName, { contentDisposition: "attachment" }),
            name: attachment.clientName,
        })));
    }

    /**
     * Get the attachments that belong to the query.
     */
    public async getAttachments() {
        return await Attachment.query().where("reference_type", PolymorphicType.Query).where("reference_id", this.id).orderBy("created_at", "desc");
    }
}
