/**
 * TODO: Remove with first stable release
 * UNTIL THIS PROJECT REACHED A FINAL STATE IT IS CONSIDERED SAFE
 * TO UPDATE, GROUP AND RE-ORDER NUMBERS IN A CONSECUTIVE ORDER!
 */
export enum ErrorCode {
    INTERNAL_ERROR = -1,

    INVALID_TOKEN = 1,
    INVALID_PAYLOAD = 2,
    INVALID_PASSWORD = 3,
    INVALID_MFA_CODE = 14,

    DUPLICATE_USERNAME = 4,
    DUPLICATE_EMAIL = 5,

    LOCKED_USERNAME = 6,
    LOCKED_ACCOUNT = 7,
    LOCKED_PASSWORD = 8,

    MISSING_TOKEN = 9,
    USER_NOT_FOUND = 10,
    NOT_ADMIN = 11,
    NOT_SET_UP = 13,
    EMAIL_FAILED_TO_DELIVER = 12,
    MFA_INVALID_ACTION = 13
}
