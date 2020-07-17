import Joi from '@hapi/joi';
import {Request, Response} from 'express';
import {config} from '../../config';
import {db} from '../../db';
import {DBUser} from '../../db/types';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

const Payload = Joi.object({
    term: Joi.string()
        .required(),

    limit: Joi.number()
        .integer()
        .default(100)
});

export const postUserSearch = async (req: Request, res: Response): Promise<unknown> => {
    const {error, value} = Payload.validate(req.body);

    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only admins are allowed to search users
    const caller = req.session.user as DBUser;
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const users = await db.user.findMany({
        select: config.db.exposed.user,
        where: {
            OR: [
                {username: {contains: value.term}},
                {email: {contains: value.term}}
            ]
        }
    });

    res.respond(users);
};
