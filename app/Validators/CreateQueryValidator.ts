import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules } from "@adonisjs/validator/build/src/Rules";
import { UserTypes } from "App/Helpers/Authentication";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";

export interface CreateQuerySchema {
    form: { subject: string; description: string; category: string; };
    relation: { on_behalf_of: string; assigned_to: string; };
    attachments: MultipartFileContract[] | undefined;
}

export default class CreateQueryValidator {
    /*
     * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
     *
     * For example:
     * 1. The username must be of data type string. But then also, it should
     *    not contain special characters or numbers.
     *    ```
     *     schema.string({}, [ rules.alpha() ])
     *    ```
     *
     * 2. The email must be of data type string, formatted as a valid
     *    email. But also, not used by any other user.
     *    ```
     *     schema.string({}, [
     *       rules.email(),
     *       rules.unique({ table: 'users', column: 'email' }),
     *     ])
     *    ```
     */
    public static schema = schema.create({
        form: schema.object().members({
            subject: schema.string({ trim: true }, [rules.minLength(3)]),
            description: schema.string({ trim: true }),
            category: schema.string({ trim: true }, [rules.exists({ table: "query_categories", column: "uuid" })]),
        }),
        relation: schema.object().members({
            on_behalf_of: schema.string({ trim: true }, [rules.exists({ table: "users", column: "uuid" })]),
            assigned_to: schema.string({ trim: true }, [rules.exists({
                table: "users",
                column: "uuid",
                where: { user_type: [UserTypes.JANSEVAK, UserTypes.ADMIN] },
            })]),
        }),
        attachments: schema.array.optional([rules.maxLength(5)]).members(schema.file({
            size: "2mb",
            extnames: ["jpg", "jpeg", "png", "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt"],
        } as any)),
    });

    /**
     * Custom messages for validation failures. You can make use of dot notation `(.)`
     * for targeting nested fields and array expressions `(*)` for targeting all
     * children of an array. For example:
     *
     * {
     *   'profile.username.required': 'Username is required',
     *   'scores.*.number': 'Define scores as valid numbers'
     * }
     *
     */
    public messages: CustomMessages = {};

    constructor(protected ctx: HttpContextContract) {}
}
