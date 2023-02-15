import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { compose } from "@ioc:Adonis/Core/Helpers";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";

export default class Announcement extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public userId: number;

    @column()
    public subject: string;

    @column()
    public content: string;

    @column()
    public slug: string;

    @column()
    public isPublished: boolean;

    @column.dateTime({ columnName: "published_at" })
    public publishedAt: DateTime | null;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the cover url of the announcement
     */
    public async coverUrl() {
        // Get the attachment
        const attachment = await this.getCoverAttachment();

        // If no attachment is found, return null
        if (!attachment) return null;

        // Get the url of the attachment
        return await attachment.getURL();
    }

    public async getCoverAttachment() {
        return await Attachment.query().where("reference_type", PolymorphicType.Announcement).where("reference_id", this.id).first();
    }
}
