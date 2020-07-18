import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {DBUser} from '../../db/types';
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

    type: Joi.string()
        .valid('user', 'admin'),

    state: Joi.string()
        .valid('activated', 'pending', 'deactivated')
});

// TODO: Add more fields
export const getUser = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.query);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only admins are allowed to fetch users
    const caller = req.session.user as DBUser;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const {page, per_page, sort, ...additionalFilter} = value;
    const offset = (page - 1) * per_page;
    const users = await db.user.findMany({
        select: config.db.exposed.user,
        where: additionalFilter,
        orderBy: {[sort]: 'desc'},
        skip: offset,
        take: per_page
    });

    return res.respond(users);
});
