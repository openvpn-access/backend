import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const getUserStats = createEndpoint({
    method: 'GET',
    route: '/users/stats',
    middleware: bearer,

    async handle(req, res) {
        const caller = req.session.user;

        // Only admins are allowed to fetch users
        if (caller.type !== 'admin') {
            return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
        }

        return res.respond({
            total_users_count: await db.user.count()
        });
    }
});
