import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

export const getUserStats = endpoint(async (req, res) => {
    const caller = req.session.user;

    // Only admins are allowed to fetch users
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    return res.respond({
        total_users_count: await db.user.count()
    });
});
