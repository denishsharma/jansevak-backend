import { schema } from "@ioc:Adonis/Core/Validator";
import { rules } from "@adonisjs/validator/build/src/Rules";
import { DateTime } from "luxon";
import { UserTypes } from "App/Helpers/Authentication";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";

export interface UserDataInterface {
    phone_number: string;
    ward: string;
    jansevak: string;
}

export const UserDataSchema = {
    phone_number: schema.string({ trim: true }, [rules.mobile()]),
    ward: schema.string({}, [rules.exists({ table: "wards", column: "code" })]),
    jansevak: schema.string({}, [rules.exists({
        table: "users",
        column: "uuid",
        where: { user_type: [UserTypes.JANSEVAK, UserTypes.ADMIN] },
    })]),
};

export interface AddressDataInterface {
    address_line_1: string;
    address_line_2: string | undefined;
    pincode: string;
    district: string;
    city: string;
    state: string;
}

export const AddressDataSchema = {
    address_line_1: schema.string({ trim: true }, [rules.maxLength(255)]),
    address_line_2: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
    pincode: schema.string({ trim: true }),
    district: schema.string({ trim: true }),
    city: schema.string({ trim: true }),
    state: schema.string({ trim: true }),
};

export interface ProfileDataInterface {
    first_name: string;
    middle_name: string | undefined;
    last_name: string;
    gender: "male" | "female" | "other";
    email: string | undefined;
    birth_date: DateTime | undefined;
    aadhar_number: string | undefined;
    pan_number: string | undefined;
    voter_id_number: string | undefined;
    address: AddressDataInterface;
}

export const ProfileDataSchema = {
    first_name: schema.string({ trim: true }, [rules.maxLength(50)]),
    middle_name: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    last_name: schema.string({ trim: true }, [rules.maxLength(50)]),
    gender: schema.enum(["male", "female", "other"] as const),
    email: schema.string.optional({ trim: true }, [rules.email()]),
    birth_date: schema.date.optional(),
    aadhar_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    pan_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    voter_id_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
    address: schema.object().members(AddressDataSchema),
};

export interface UpdateProfileDataInterface {
    user: { ward: string | undefined; jansevak: string | undefined; };
    profile: { first_name: string | undefined; middle_name: string | undefined; last_name: string | undefined; gender: "male" | "female" | "other" | undefined; email: string | undefined; birth_date: DateTime | undefined; aadhar_number: string | undefined; pan_number: string | undefined; voter_id_number: string | undefined; address: { address_line_1: string | undefined; address_line_2: string | undefined; pincode: string | undefined; district: string | undefined; city: string | undefined; state: string | undefined; } | undefined; };
    avatar: MultipartFileContract | undefined;
}

export const UpdateProfileDataSchema = {
    user: schema.object().members({
        ward: schema.string.optional({}, [rules.exists({ table: "wards", column: "code" })]),
        jansevak: schema.string.optional({}, [rules.exists({
            table: "users",
            column: "uuid",
            where: { user_type: [UserTypes.JANSEVAK, UserTypes.ADMIN] },
        })]),
    }),
    profile: schema.object().members({
        first_name: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        middle_name: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        last_name: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        gender: schema.enum.optional(["male", "female", "other"] as const),
        email: schema.string.optional({ trim: true }, [rules.email()]),
        birth_date: schema.date.optional(),
        aadhar_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        pan_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        voter_id_number: schema.string.optional({ trim: true }, [rules.maxLength(50)]),
        address: schema.object.optional().members({
            address_line_1: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
            address_line_2: schema.string.optional({ trim: true }, [rules.maxLength(255)]),
            pincode: schema.string.optional({ trim: true }),
            district: schema.string.optional({ trim: true }),
            city: schema.string.optional({ trim: true }),
            state: schema.string.optional({ trim: true }),
        }),
    }),
    avatar: schema.file.optional({
        size: "2mb",
        extnames: ["jpg", "png", "jpeg"],
    }),
};

export const CreateJansevakDataSchema = {
    user: schema.object().members({
        phone_number: schema.string({ trim: true }, [rules.mobile(), rules.unique({
            table: "users",
            column: "phone_number",
        })]),
        ward: schema.string({}, [rules.exists({ table: "wards", column: "code" })]),
    }),
    profile: schema.object().members(ProfileDataSchema),
    avatar: schema.file.optional({
        size: "2mb",
        extnames: ["jpg", "png", "jpeg"],
    }),
};

export const CreateJansevakDataSchemaMessages = {
    required: "The {{ field }} is required",
    "user.phone_number.mobile": "The phone number is not valid",
    "user.phone_number.unique": "The phone number is already registered",
    "user.ward.exists": "The ward does not exist",
    "profile.first_name.maxLength": "The first name must be less than 50 characters",
    "profile.middle_name.maxLength": "The middle name must be less than 50 characters",
    "profile.last_name.maxLength": "The last name must be less than 50 characters",
    "profile.gender.enum": "The gender is not valid",
    "profile.email.email": "The email is not valid",
    "profile.address.address_line_1.maxLength": "The address line 1 must be less than 255 characters",
    "profile.address.address_line_2.maxLength": "The address line 2 must be less than 255 characters",
    "avatar.size": "The avatar size must be less than 2mb",
    "avatar.extnames": "The avatar must be a file of type: jpg, png, jpeg",
};

export interface AvatarDataInterface {
    form: { subject: string; content: string; publish?: boolean; };
    cover: MultipartFileContract | undefined;
}

export const AnnouncementDataSchema = {
    form: schema.object().members({
        subject: schema.string({ trim: true }, [rules.minLength(5)]),
        content: schema.string({ trim: true }, [rules.minLength(10)]),
        publish: schema.boolean.optional(),
    }),
    cover: schema.file.optional({
        size: "2mb",
        extnames: ["jpg", "png", "jpeg"],
    }),
};
