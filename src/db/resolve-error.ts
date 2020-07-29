import {ErrorCode} from '../api/enums/ErrorCode';
import {Status} from '../api/enums/Status';

// TODO: Are there any TD's out there for db-related errors?
type DBError = {
    code: string;
    meta: {
        target: string;
    };
}

/**
 * Tries to convert an error thrown by prisma into a human, nicely readable format.
 * @param e
 */
export const resolveDBError = (e: DBError): [string, Status, ErrorCode] | null => {
    if (e && e.code === 'P2002') {
        const field = e.meta.target;

        if (field === 'username') {
            return ['This username is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME];
        } else if (field === 'email') {
            return ['This email is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL];
        }
    }

    return null;
};
