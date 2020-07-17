import Joi from '@hapi/joi';
import {Request, Response} from 'express';
import {config} from '../../config';
import {db} from '../../db';
import {DBUser} from '../../db/types';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

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
        .default('id')
});

// TODO: Add more fields
export const getUser = async (req: Request, res: Response): Promise<unknown> => {
    const {error, value} = Payload.validate(req.query);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only admins are allowed to fetch users
    const caller = req.session.user as DBUser;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const {page, per_page, sort} = value;
    const offset = (page - 1) * per_page;
    const users = await db.user.findMany({
        select: config.db.exposed.user,
        orderBy: {[sort]: 'desc'},
        skip: offset,
        take: per_page
    });

    res.respond(users);
};
