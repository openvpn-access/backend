import Joi from '@hapi/joi';
import {compare, hash} from 'bcrypt';
import {Request, Response} from 'express';
import {config} from '../config';
import {query} from '../db';
import {DBUser} from '../db/types';
import {Status} from '../utils/status';

type PatchUserPayload = {
    username?: string;
    email?: string;
    type?: DBUser['type'],
    password?: string;
    currentPassword?: string;
};

const Payload = Joi.object({
    username: Joi.string().allow(''),
    email: Joi.string().allow(''),
    type: Joi.string().valid('user', 'admin'),
    password: Joi.string().allow(''),
    currentPassword: Joi.string().allow('')
});

export const patchUser = async (req: Request, res: Response): Promise<void> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error);
    }

    const caller = req.session.user;
    const {user} = req.params;

    const {
        username = caller.username,
        email = caller.email,
        type = caller.type,
        currentPassword // TODO: Conver to snake case
    } = value as PatchUserPayload;

    if (user === 'admin' && caller.username === 'admin' && username !== 'admin') {
        return res.error('The admin cannot change its username.', Status.FORBIDDEN); // TODO: Move error codes to module
    }

    // Validate password
    if (
        currentPassword && !(await compare(currentPassword, caller.password)) ||
        (caller.type === 'admin' && username !== 'admin' && value.password !== undefined)
    ) {
        return res.error('Invalid password', Status.FORBIDDEN);
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

    return res.respond(

        // TODO: Move to utility?
        (await query(`
            SELECT id, created_at, updated_at, type, state, email, email_verified, username
                FROM user
                WHERE username = ?
        `, user))[0],
        Status.OK
    );
};
