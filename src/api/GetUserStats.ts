import {Server} from 'hapi';
import {query} from '../db';
import {DBUser} from '../db/types';
import {createError} from '../utils/error';
import {STATUS} from '../utils/status';

export const getUserStats = (server: Server): void => {
    server.route({
        method: 'GET',
        path: '/users/stats',
        async handler(req, rt) {
            const caller = req.auth.credentials.user as DBUser;

            // Only admins are allowed to fetch users
            if (caller.type !== 'admin') {
                return createError('Not allowed.', STATUS.UNAUTHORIZED, 1);
            }

            const res = await query(`
                SELECT COUNT(*) as count
                    FROM user
            `);

            if (!res.length) {
                return createError('Couldn\' find any values', STATUS.INTERNAL_SERVER_ERROR, 2);
            }

            return rt.response({
                total_users_count: res[0].count
            }).code(STATUS.OK);
        }
    });
};
