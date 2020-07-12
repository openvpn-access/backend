import Joi from '@hapi/joi';
import {compare, hash} from 'bcrypt';
import {Request, Response} from 'express';
import {config} from '../config';
import {query} from '../db';
import {DBUser} from '../db/types';
import {ErrorCode} from './enums/ErrorCode';
import {Status} from './enums/Status';

type PatchUserPayload = {
    username?: string;
    email?: string;
    type?: DBUser['type'];
    password?: string;
    current_password?: string;
};

const Payload = Joi.object({
    username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[\w]+$/),

    email: Joi.string()
        .email({tlds: false}),

    type: Joi.string()
        .valid('user', 'admin'),

    password: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^[^\s]+$/),

    current_password: Joi.string()
});

export const patchUser = async (req: Request, res: Response): Promise<void> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    const caller = req.session.user;
    const {user} = req.params;

    const {
        username = caller.username,
        email = caller.email,
        type = caller.type,
        current_password
    } = value as PatchUserPayload;

    if (user === 'admin' && caller.username === 'admin' && username !== 'admin') {
        return res.error('The admin cannot change its username.', Status.FORBIDDEN, ErrorCode.NOT_ALLOWED);
    }

    // Validate password
    if (
        current_password && !(await compare(current_password, caller.password)) ||
        (caller.type === 'admin' && username !== 'admin' && value.password !== undefined)
    ) {
        return res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
    }

    // Update user in db
    const newPassword = value.password ? await hash(value.password, config.security.saltRounds) : caller.password;
    await query(`
        UPDATE user
            SET username = ?,
                email = ?,
                type = ?,
                password = ?
            WHERE username = ?;
    `, [username, email, type, newPassword, user]); // TODO: Invalidate all sessions?

    return res.respond((await query(`
        SELECT id, created_at, updated_at, type, state, email, email_verified, username
            FROM user
            WHERE username = ?
    `, user))[0]);
};
