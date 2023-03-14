import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import fs from "fs";
import Application from "@ioc:Adonis/Core/Application";
import Otp from "App/Models/Otp";
import User from "App/Models/User";
import { rules, schema, validator } from "@ioc:Adonis/Core/Validator";

const privateKey = fs.readFileSync(Application.makePath("/keys/private.pem"), "utf8");
const publicKey = fs.readFileSync(Application.makePath("/keys/public.pem"), "utf8");

export enum UserTypes {
    ADMIN = <any>"admin",
    JANSEVAK = <any>"jansevak",
    NAGRIK = <any>"nagrik",
}

export enum UserVerificationStatuses {
    PENDING = <any>"pending",
    REJECTED = <any>"rejected",
    VERIFIED = <any>"verified",
}

export enum OtpTypes {
    AUTH = <any>"auth",

    // Service related
    SERVICE_NEW_NAGARIK = <any>"service_new_nagarik",
}

/**
 * Get the logged in user
 * @param auth
 * @param response
 */
export async function getLoggedInUser(auth: HttpContextContract["auth"]) {
    try {
        await auth.use("jwt").authenticate();
        const user = auth.use("jwt").user!;
        const userPayload = auth.use("jwt").payload!;

        try {
            await validator.validate({
                schema: schema.create({
                    id: schema.string({ trim: true }, [rules.uuid(), rules.exists({
                        table: "users",
                        column: "uuid",
                        where: { deleted_at: null },
                    })]),
                    userId: schema.number([rules.exists({
                        table: "users",
                        column: "id",
                        where: { deleted_at: null },
                    } as any)]),
                }),
                data: userPayload,
                reporter: validator.reporters.api,
            });
        } catch {
            return undefined;
        }


        if (!user) {
            return undefined;
        }

        return user;
    } catch (error) {
        throw new UnknownErrorException(error, error.messages);
    }
}

export function generateRSASignature(data: any) {
    const crypto = require("crypto");
    const sign = crypto.createSign("RSA-SHA256");
    sign.write(data);
    sign.end();
    return sign.sign({
        key: privateKey,
        passphrase: "test",
    }, "base64");
}

export function verifyRSASignature(data: any, signature: string) {
    const crypto = require("crypto");
    const verify = crypto.createVerify("RSA-SHA256");
    verify.write(data);
    verify.end();
    return verify.verify(publicKey, signature, "base64");
}

/**
 * Verify the otp using the signature
 * @param user
 * @param service
 * @param otp
 * @param sig
 */
export async function verifyOTP(user: User, service: OtpTypes, otp: string, sig: string) {
    try {
        let isValid = false;

        // get the otp from the database
        const otpModel = await Otp.query().where("user_id", user.id).where("type", service).where("otp", otp).first();
        if (otpModel && !otpModel.isExpired()) isValid = true;

        let payload = otpModel?.payload || "{}";

        // verify the signature
        const isVerified = verifyRSASignature(Buffer.from(payload).toString("base64"), sig);
        if (isVerified) isValid = true;

        // delete the otp
        await otpModel?.delete();

        return { isValid: isValid, payload: JSON.parse(payload) };
    } catch (e) {
        throw new UnknownErrorException(e);
    }

}
