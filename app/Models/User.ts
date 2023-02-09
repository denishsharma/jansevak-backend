import { DateTime } from "luxon";
import Hash from "@ioc:Adonis/Core/Hash";
import { BaseModel, beforeCreate, beforeSave, column, hasOne, HasOne, HasMany, hasMany, manyToMany, ManyToMany } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@ioc:Adonis/Core/Helpers";
import { SoftDeletes } from "@ioc:Adonis/Addons/LucidSoftDeletes";
import { v4 as uuidv4 } from "uuid";
import Otp from "App/Models/Otp";
import Event from "@ioc:Adonis/Core/Event";
import Permission from "App/Models/Permission";
import Permissions, { getPermissionNames, hasAnyPermission, hasRequiredPermission } from "App/Helpers/Permissions";
import Profile from "App/Models/Profile";
import { UserTypes } from "App/Helpers/Authentication";

export default class User extends compose(BaseModel, SoftDeletes) {
    @column({ isPrimary: true })
    public id: number;

    @column()
    public uuid: string;

    @column()
    public phoneNumber: string;

    @column()
    public email: string;

    @column({ serializeAs: null })
    public password: string;

    @column()
    public rememberMeToken: string | null;

    @column()
    public isRegistered: boolean;

    @column()
    public isArchived: boolean;

    @column()
    public isSuperAdmin: boolean;

    @column()
    public isSetupCompleted: boolean;

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

    @hasMany(() => Otp)
    public otps: HasMany<typeof Otp>;

    @manyToMany(() => Permission, { pivotTable: "permission_user" })
    public permissions: ManyToMany<typeof Permission>;

    @hasOne(() => Profile)
    public profile: HasOne<typeof Profile>;

    /**
     * Hash password before saving
     * @param {User} user
     * @returns {Promise<void>}
     */
    @beforeSave()
    public static async hashPassword(user: User) {
        if (user.$dirty.password) {
            user.password = await Hash.make(user.password);
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
        let otp = await Otp.query()
            .where("user_id", this.id)
            .whereNull("deleted_at")
            .where("expires_at", ">=", DateTime.fromSeconds(DateTime.now().toSeconds()).toString())
            .first();

        if (!otp) {
            const otp_number = Math.floor(100000 + Math.random() * 900000);
            otp = await Otp.create({
                otp: otp_number.toString(),
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
        return await auth.use("jwt").loginViaRefreshToken(refreshToken, { payload: { id: this.uuid } });
    }

    /**
     * Logout user and revoke JWT token
     * @param auth
     * @returns {Promise<void>}
     */
    public async logout(auth: any) {
        await auth.use("jwt").revoke();
    }
}
