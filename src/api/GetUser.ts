import Joi from '@hapi/joi';
import {Request, Response} from 'express';
import {query} from '../db';
import {DBUser} from '../db/types';
import {Status} from '../utils/status';

type GetUserPayload = {
    page?: number;
    per_page?: number;
    sort?: string;
};

const Payload = Joi.object({
    page: Joi.number().integer().positive().min(1),
    per_page: Joi.number().integer().positive().min(1),
    sort: Joi.string().valid('id', 'created_at', 'updated_at', 'type', 'state', 'email', 'email_verified', 'username')
});

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const {error, value} = Payload.validate(req.query);
    if (error) {
        return res.error(error);
    }

    // Only admins are allowed to fetch users
    const caller = req.session.user as DBUser;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED);
    }

    const {
        page = 1,
        per_page = 60,
        sort = 'id'
    } = value as GetUserPayload;

    // TODO: per_page limit?
    const offset = (page - 1) * per_page;
    const qres = await query(`
        SELECT id, created_at, updated_at, type, state, email, email_verified, username
            FROM user
            ORDER BY ${sort /* '?' does not work, sort is an enum and therefore properly validated  */}
            LIMIT ?
            OFFSET ?
    `, [per_page, offset]);

    return res.respond(qres);
};
