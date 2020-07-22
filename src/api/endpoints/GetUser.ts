import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
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
});

// TODO: Add more fields
export const getUser = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.query);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only admins are allowed to fetch users
    const caller = req.session.user;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const {page, per_page, sort, sort_dir, search, ...additionalFilter} = value;
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
});
