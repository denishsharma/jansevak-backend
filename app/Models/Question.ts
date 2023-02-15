import { DateTime } from "luxon";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";

export default class Question extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public slug: string;

    @column()
    public question: string;

    @column()
    public answer: string;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;
}
