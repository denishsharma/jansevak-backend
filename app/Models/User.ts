import { DateTime } from "luxon";
import Hash from "@ioc:Adonis/Core/Hash";
import { BaseModel, beforeCreate, beforeSave, column, HasMany, hasMany, hasOne, HasOne, manyToMany, ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { v4 as uuidv4 } from "uuid";
import Otp from "App/Models/Otp";
import Event from "@ioc:Adonis/Core/Event";
import Permission from "App/Models/Permission";
import Permissions, { getPermissionNames, hasAnyPermission, hasRequiredPermission } from "App/Helpers/Permissions";
import Profile from "App/Models/Profile";
import { OtpTypes, UserTypes } from "App/Helpers/Authentication";
import Group from "App/Models/Group";
import UserQuery from "App/Models/UserQuery";
import UserAllocation from "App/Models/UserAllocation";
import { GroupTypes } from "App/Helpers/Groups";

export default class User extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true, serializeAs: null })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public fid: string;

    @column()
    public phoneNumber: string | null;

    @column()
    public email: string | null;

    @column({ serializeAs: null })
    public password: string | null;

    @column({ serializeAs: null })
    public rememberMeToken: string | null;

    @column({ serialize: (value?: Number) => Boolean(value) })
    public isRegistered: boolean;

    @column({ serialize: (value?: Number) => Boolean(value) })
    public isArchived: boolean;

    @column({ serializeAs: null })
    public isSuperAdmin: boolean;

    @column({ serialize: (value?: Number) => Boolean(value) })
    public isSetupCompleted: boolean | null;

    @column({ serialize: (value?: Number) => Boolean(value) })
    public isVerified: boolean;

    @column({ serialize: (value: string) => UserTypes[value] })
    public userType: UserTypes;

    @column.dateTime()
    public emailVerifiedAt: DateTime | null;

    @column.dateTime()
    public lastLoginAt: DateTime | null;

    @column.dateTime()
    public registeredAt: DateTime | null;

    @column.dateTime({ columnName: "deleted_at" })
    public deletedAt: DateTime | null;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @hasOne(() => UserAllocation, { foreignKey: "userId" })
    public allocation: HasOne<typeof UserAllocation>;

    /**
     * Get all otps.
     * @type {HasMany<typeof Otp>}
     */
    @hasMany(() => Otp)
    public otps: HasMany<typeof Otp>;

    /**
     * Get all permissions.
     * @type {ManyToMany<typeof Permission>}
     */
    @manyToMany(() => Permission, { pivotTable: "permission_user" })
    public permissions: ManyToMany<typeof Permission>;

    /**
     * Get user profile.
     * @type {HasOne<typeof Profile>}
     */
    @hasOne(() => Profile)
    public profile: HasOne<typeof Profile>;

    /**
     * Get all queries created by me.
     */
    @hasMany(() => UserQuery, { foreignKey: "created_by" })
    public myCreatedQueries: HasMany<typeof UserQuery>;

    /**
     * Get all queries created on behalf of me.
     */
    @hasMany(() => UserQuery, { foreignKey: "on_behalf_of" })
    public queriesCreatedOnBehalfOfMe: HasMany<typeof UserQuery>;

    /**
     * Get all queries assigned to me.
     */
    @hasMany(() => UserQuery, { foreignKey: "for_jansevak" })
    public assignedQueriesToMe: HasMany<typeof UserQuery>;


    /**
     * Get all groups.
     */
    @manyToMany(() => Group, {
        pivotTable: "group_user",
        pivotColumns: ["added_by"],
    })
    public groups: ManyToMany<typeof Group>;

    /**
     * Family group created by me. (Not the one I am a member of)
     */
    @hasOne(() => Group, {
        onQuery: (query) => query.where("type", GroupTypes.FAMILY).whereNull("deleted_at"),
    })
    public familyGroup: HasOne<typeof Group>;

    /**
     * Get all groups I have created.
     */
    @hasMany(() => Group)
    public myGroups: HasMany<typeof Group>;

    /**
     * Hash password before saving
     * @param {User} user
     * @returns {Promise<void>}
     */
    @beforeSave()
    public static async hashPassword(user: User) {
        if (user.password !== null) {
            if (user.$dirty.password) {
                user.password = await Hash.make(user.password);
            }
        }
    }

    /**
     * Generate uuid before creating
     * @param {User} user
     * @returns {Promise<void>}
     */
    @beforeCreate()
    public static async generateUuid(user: User) {
        user.uuid = uuidv4();
    }

    @beforeCreate()
    public static async generateFid(user: User) {
        if (user.phoneNumber && user.isRegistered) {
            user.fid = String(Math.floor(Math.random() * 1000000000));
        }
    }

    /**
     * Get all queries created by me or on behalf of me.
     * @returns {Promise<UserQuery[]>}
     */
    public async myQueries(): Promise<UserQuery[]> {
        return await UserQuery.query().where("created_by", this.id).orWhere("on_behalf_of", this.id);
    }

    /**
     * Check if user has all the required permissions
     * @param {Array<keyof typeof Permissions>} permissions
     * @returns {Promise<boolean>}
     */
    public async hasPermissions(permissions: Array<keyof typeof Permissions>) {
        return hasRequiredPermission(permissions, await this.permissions);
    }

    /**
     * Check if user has any of the required permissions
     * @param {Array<keyof typeof Permissions>} permissions
     * @returns {Promise<boolean>}
     */
    public async anyPermissions(permissions: Array<keyof typeof Permissions>) {
        return hasAnyPermission(permissions, await this.permissions);
    }

    /**
     * Generate OTP for user and send it to user
     * @returns {Promise<Otp>}
     */
    public async generateOtp(): Promise<Otp> {
        if (this.phoneNumber === null) {
            return Promise.reject("User does not have a phone number");
        }

        let otp = await Otp.query()
            .where("user_id", this.id)
            .where("type", OtpTypes.AUTH)
            .whereNull("deleted_at")
            .where("expires_at", ">=", DateTime.fromSeconds(DateTime.now().toSeconds()).toString())
            .first();

        if (!otp) {
            const otp_number = Math.floor(100000 + Math.random() * 900000);
            otp = await Otp.create({
                otp: otp_number.toString(),
                phoneNumber: this.phoneNumber,
                type: OtpTypes.AUTH,
                userId: this.id,
                expiresAt: DateTime.fromSeconds(DateTime.now().toSeconds()).plus({ minutes: 5 }),
            });
        }

        await Event.emit("otp:generated", {
            user: { id: this.uuid, phoneNumber: this.phoneNumber },
            otp: otp.otp,
            expiresAt: otp.expiresAt.toString(),
        });

        return otp;
    }

    /**
     * Verify OTP for user
     * @param {string} otp
     * @returns {Promise<boolean>}
     */
    public async verifyOtp(otp: string) {
        const otps = await Otp.query()
            .where("user_id", this.id)
            .where("type", OtpTypes.AUTH)
            .where("otp", otp)
            .whereNull("deleted_at")
            .where("expires_at", ">=", DateTime.fromSeconds(DateTime.now().toSeconds()).toString())
            .first();

        if (otps) {
            await otps.delete();
            return true;
        }

        return false;
    }

    /**
     * Login user and generate JWT token
     * @param auth
     * @returns {Promise<any>}
     */
    public async login(auth: any) {
        return await auth.use("jwt").login(this, {
            payload: {
                id: this.uuid,
                permissions: await getPermissionNames(this),
                user_type: UserTypes[this.userType],
            },
        });
    }

    /**
     * Refresh JWT token for user
     * @param auth
     * @param {string} refreshToken
     * @returns {Promise<JWTTokenContract<GetProviderRealUser<keyof ProvidersList>>>}
     */
    public async refreshToken(auth: any, refreshToken: string) {
        return await auth.use("jwt").loginViaRefreshToken(refreshToken, {
            payload: {
                id: this.uuid,
                permissions: await getPermissionNames(this),
                user_type: UserTypes[this.userType],
            },
        });
    }

    /**
     * Logout user and revoke JWT token
     * @param auth
     * @returns {Promise<void>}
     */
    public async logout(auth: any) {
        await auth.use("jwt").revoke();
    }

    /**
     * Verify user password
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    public async verifyPassword(password: string) {
        if (this.password === null) return false;
        return await Hash.verify(this.password, password);
    }
}
