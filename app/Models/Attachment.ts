import { DateTime } from "luxon";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import Drive from "@ioc:Adonis/Core/Drive";
import { getPolymorphicModel, PolymorphicType } from "App/Helpers/Polymorphism";

export default class Attachment extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public fileName: string;

    @column()
    public filePath: string;

    @column()
    public fileType: string;

    @column()
    public mimeType: string;

    @column()
    public clientName: string;

    @column()
    public referenceId: number;

    @column({ serialize: (value: string) => PolymorphicType[value] })
    public referenceType: PolymorphicType;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    /**
     * Get the signed URL for the attachment
     */
    public async getURL() {
        return await Drive.getSignedUrl(this.fileName, {
            contentType: this.mimeType,
        });
    }

    public async getMorphed() {
        const modelType = getPolymorphicModel(this.referenceType);
        return await modelType?.query().where("id", this.referenceId).first();
    }

    public async deleteFile() {
        await Drive.delete(this.fileName);
        return await super.delete();
    }
}
