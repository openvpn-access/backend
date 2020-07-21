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
        .valid('id', 'user_id', 'created_at', 'state', 'ip_addr', 'username')
        .default('id'),

    sort_dir: Joi.string()
        .valid('asc', 'desc')
        .default('desc'),

    username: Joi.string(),
    ip_addr: Joi.string(),
    user_id: Joi.number(),

    state: Joi.string()
        .valid('pass', 'fail')
});

export const getLoginAttemptWeb = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.query);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only admins are allowed to fetch users
    // TODO: Make this a middleware?
    const caller = req.session.user;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const {page, per_page, sort, sort_dir, ...additionalFilter} = value;
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
});
