import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const getLoginAttemptWeb = createEndpoint({
    method: 'GET',
    route: '/login-attempts/web',
    middleware: bearer,

    validation: {
        query: Joi.object({
            page: Joi.number()
                .integer()
                .positive()
                .min(1)
                .default(1),

            per_page: Joi.number()
                .integer()
                .positive()
                .min(1)
                .default(60),

            sort: Joi.string()
                .valid('id', 'user_id', 'created_at', 'state', 'ip_addr', 'login_id')
                .default('id'),

            sort_dir: Joi.string()
                .valid('asc', 'desc')
                .default('desc'),

            login_id: Joi.string(),
            ip_addr: Joi.string(),
            user_id: Joi.number(),

            state: Joi.string()
                .valid('pass', 'fail')
        })
    },

    async handle(req, res) {

        // Only admins are allowed to fetch users
        // TODO: Make this a middleware?
        const caller = req.session.user;
        if (caller.type !== 'admin') {
            return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
        }

        const {page, per_page, sort, sort_dir, ...additionalFilter} = req.query;
        const offset = (page - 1) * per_page;
        const loginAttempts = await db.web_login_attempt.findMany({
            select: config.db.exposed.web_login_attempt,
            where: {
                ...additionalFilter
            },
            orderBy: {[sort]: sort_dir},
            skip: offset,
            take: per_page
        });

        return res.respond(loginAttempts);
    }
});
