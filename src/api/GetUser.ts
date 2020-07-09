import Joi from '@hapi/joi';
import {Server} from 'hapi';
import {query} from '../db';
import {DBUser} from '../db/types';
import {createError} from '../utils/error';
import {STATUS} from '../utils/status';

type GetUserPayload = {
    page?: number;
    per_page?: number;
    sort?: string;
};

export const getUser = (server: Server): void => {
    server.route({
        method: 'GET',
        path: '/users',
        options: {
            validate: {
                query: Joi.object({
                    page: Joi.number().integer().positive().min(1),
                    per_page: Joi.number().integer().positive().min(1),
                    sort: Joi.string().valid('id', 'created_at', 'updated_at', 'type', 'state', 'email', 'email_verified', 'username')
                })
            }
        },
        async handler(req, rt) {
            const caller = req.auth.credentials.user as DBUser;

            // Only admins are allowed to fetch users
            if (caller.type !== 'admin') {
                return createError('Not allowed.', STATUS.UNAUTHORIZED, 1);
            }

            const {
                page = 1,
                per_page = 60,
                sort = 'id'
            } = req.query as GetUserPayload;

            // TODO: per_page limit?
            const offset = (page - 1) * per_page;
            const res = await query(`
                SELECT id, created_at, updated_at, type, state, email, email_verified, username
                    FROM user
                    ORDER BY ${sort /* '?' does not work, sort is an enum and therefore properly validated  */}
                    LIMIT ?
                    OFFSET ?
            `, [per_page, offset]);

            return rt.response(res).code(STATUS.OK);
        }
    });
};
