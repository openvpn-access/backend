import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

// TODO: Add more fields
export const getUser = createEndpoint({
    method: 'GET',
    route: '/users',
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
                .valid('id', 'created_at', 'updated_at', 'type', 'state', 'email', 'email_verified', 'username')
                .default('id'),

            sort_dir: Joi.string()
                .valid('asc', 'desc')
                .default('desc'),

            type: Joi.string()
                .valid('user', 'admin'),

            email_verified: Joi.boolean(),
            activated: Joi.boolean(),

            // Search query
            search: Joi.string()
        })
    },

    async handle(req, res) {

        // Only admins are allowed to fetch users
        const caller = req.session.user;
        if (caller.type !== 'admin') {
            return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
        }

        const {page, per_page, sort, sort_dir, search, ...additionalFilter} = req.query;
        const offset = (page - 1) * per_page;
        const users = await db.user.findMany({
            select: config.db.exposed.user,
            where: {
                ...additionalFilter,
                ...(search && {
                    OR: [
                        {username: {contains: search}},
                        {email: {contains: search}}
                    ]
                })
            },
            orderBy: {[sort]: sort_dir},
            skip: offset,
            take: per_page
        });

        return res.respond(users);
    }
});
