export enum ResponseCodes {
    PHONE_NUMBER_ALREADY_EXISTS = 1001,
    PHONE_NUMBER_NOT_PROVIDED = 1002,
    OTP_SENT = 1003,
    USER_CREATED = 1004,
    INVALID_OTP = 1005,
    USER_NOT_FOUND = 1006,
    USER_NOT_AUTHORIZED = 1007,
    USER_LOGGED_IN = 1008,
    USER_LOGGED_OUT = 1009,
    USER_NOT_AUTHENTICATED = 1010,
    USER_VERIFIED = 1011,
    USER_NOT_VERIFIED = 1012,
    INVALID_REQUEST = 1013,
    PERMISSION_NOT_FOUND = 1014,
    PERMISSION_ALREADY_ASSIGNED = 1015,
    PERMISSION_NOT_ASSIGNED = 1016,
    PERMISSION_ASSIGNED = 1017,
    PERMISSION_REVOKED = 1018,
    PASSWORD_NOT_PROVIDED = 1019,
    EMAIL_NOT_PROVIDED = 1020,
    BAD_INPUT = 1021,
    PASSWORD_RESET_DONE = 1022,
    USER_UPDATED = 1023,
    PASSWORD_DID_NOT_MATCH = 1024,
    PROFILE_UPDATED = 1025,
    PROFILE_NOT_FOUND = 1026,
    PROFILE_SETUP_COMPLETED = 1027,
    PROFILE_DATA_MISSING = 1028,
    DATA_NOT_FOUND = 1029,
    SUCCESS_WITH_DATA = 2000,
    SUCCESS_WITH_NO_DATA = 1030,
}

export default class Responses {
    public static createResponse(data: any = {}, codes: ResponseCodes[] = [], message: string = "") {
        const _codes = Object.assign({}, ...codes.map((code) => ({ [ResponseCodes[code]]: code })));

        return {
            ...(data && { data }),
            ...(codes && { codes: _codes }),
            ...(message && { message }),
        };
    }
}
