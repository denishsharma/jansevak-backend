import { DateTime } from "luxon";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { UserVerificationStatuses } from "App/Helpers/Authentication";
import User from "App/Models/User";
import Ward from "App/Models/Ward";

export default class UserAllocation extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column({ serializeAs: null })
    public userId: number;

    @column({ serializeAs: null })
    public wardId: number;

    @column({ serializeAs: null })
    public allocatedTo: number;

    @column({ serializeAs: null })
    public verifiedBy: number;

    @column({ serializeAs: null })
    public createdBy: number;

    @column({ serialize: (value: string) => UserVerificationStatuses[value] })
    public verification: UserVerificationStatuses;

    @column.dateTime()
    public verifiedAt: DateTime | null;

    @column.dateTime()
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => User, { foreignKey: "userId" })
    public user: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: "allocatedTo" })
    public allocatedToUser: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: "verifiedBy" })
    public verifiedByUser: BelongsTo<typeof User>;

    @belongsTo(() => User, { foreignKey: "createdBy" })
    public createdByUser: BelongsTo<typeof User>;

    @belongsTo(() => Ward, { foreignKey: "wardId", serializeAs: "ward" })
    public wardUser: BelongsTo<typeof Ward>;
}
