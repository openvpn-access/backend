import Joi from '@hapi/joi';
import {compare, hash} from 'bcrypt';
import {Request, Response} from 'express';
import {config} from '../../config';
import {query} from '../../db';
import {DBUser} from '../../db/types';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

const Payload = Joi.object({
    type: Joi.string()
        .valid('user', 'admin'),

    state: Joi.string()
        .valid('activated', 'pending', 'deactivated'),

    email: Joi.string()
        .email({tlds: false}),

    username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[\w.]+$/),

    password: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^[^\s]+$/),

    transfer_limit_period: Joi.alternatives(Joi.number(), null),
    transfer_limit_start: Joi.alternatives(Joi.date(), null),
    transfer_limit_end: Joi.alternatives(Joi.date(), null),
    transfer_limit_bytes: Joi.alternatives(Joi.number(), null),

    current_password: Joi.string()
});

export const patchUser = async (req: Request, res: Response): Promise<unknown> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    const caller = req.session.user;
    const {user} = req.params;

    // The administrator cannot change its username
    if (user === 'admin' && caller.username === 'admin' && value.username !== undefined && value.username !== 'admin') {
        return res.error('The admin cannot change its username.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
    }

    // Users can only change themselves
    if (caller.type === 'user' && caller.username !== user) {
        return res.error('Users can only change themselves.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
    }

    // Administrators can only change non-password fields
    if (caller.type === 'admin' && caller.username !== user && value.password !== undefined) {
        return res.error('Password cannot be changed by administrators.', Status.FORBIDDEN, ErrorCode.LOCKED_PASSWORD);
    }

    // Validate password
    if (value.current_password && !(await compare(value.current_password, caller.password))) {
        return res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
    }

    // Find user to update
    const [, targetList] = await query('SELECT * FROM user WHERE username = ?', [user]);
    if (!targetList.length) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    // pre-process password
    if (value.password) {
        value.password = await hash(value.password, config.security.saltRounds);
    }

    const updatedUser = {
        _target: user,
        ...targetList[0],
        ...value
    } as DBUser;

    // Check if username or email is already in use
    const [err, other] = await query(`
        SELECT username, email
            FROM user
            WHERE username != :_target
              AND (username = :username OR email = :email)
    `, updatedUser);

    if (!err && other.length) {
        const [user] = other;

        // Check if username or email were already in use
        if (user.username === updatedUser.username) {
            return res.error('Username is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME);
        } else if (user.email === updatedUser.email) {
            return res.error('Email is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL);
        }

        // I have no Idea how we would get here
        return res.sendStatus(500);
    }

    // Update user in db
    // TODO: Invalidate all sessions?
    const [qerr, qres] = await query(`
        UPDATE user
            SET username = :username,
                email = :email,
                type = :type,
                state = :state,
                password = :password,
                transfer_limit_period = :transfer_limit_period,
                transfer_limit_start = :transfer_limit_start,
                transfer_limit_end = :transfer_limit_end,
                transfer_limit_bytes = :transfer_limit_bytes
            WHERE username = :_target;
    `, updatedUser)
        .then(() => query(`
            SELECT ${config.db.exposed.user.join(',')}
                FROM user
                WHERE username = ?
                LIMIT 1
        `, updatedUser.username));

    if (qerr || !qres.length) {
        return res.sendStatus(500);
    }

    return res.respond(qres[0]);
};
