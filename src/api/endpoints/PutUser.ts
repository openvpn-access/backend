import Joi from '@hapi/joi';
import {hash} from 'bcrypt';
import {Request, Response} from 'express';
import {config} from '../../config';
import {query} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

const Payload = Joi.object({
    type: Joi.string()
        .valid('user', 'admin')
        .required(),

    state: Joi.string()
        .valid('activated', 'pending', 'deactivated')
        .default('pending'),

    email: Joi.string()
        .email({tlds: false})
        .required(),

    username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[\w.]+$/)
        .required(),

    password: Joi.string()
        .min(8)
        .max(50)
        .pattern(/^[^\s]+$/)
        .required(),

    transfer_limit_period: Joi.alternatives(Joi.number(), null).default(null),
    transfer_limit_start: Joi.alternatives(Joi.date(), null).default(null),
    transfer_limit_end: Joi.alternatives(Joi.date(), null).default(null),
    transfer_limit_bytes: Joi.alternatives(Joi.number(), null).default(null)
});

export const putUser = async (req: Request, res: Response): Promise<unknown> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Only administrators can add users
    const caller = req.session.user;
    if (caller.type !== 'admin') {
        return res.error('Only administrators can add users.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
    }

    // Hash password
    value.password = await hash(value.password, config.security.saltRounds);

    // Check if username or email is already in use
    const [err, other] = await query(`
        SELECT username, email
            FROM user
            WHERE username = :username OR email = :email
    `, value);

    if (!err && other.length) {
        const [user] = other;

        // Check if username or email were already in use
        if (user.username === value.username) {
            return res.error('Username is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME);
        } else if (user.email === value.email) {
            return res.error('Email is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL);
        }

        // I have no Idea how we would get here
        return res.sendStatus(500);
    }

    // Update user in db
    // TODO: Invalidate all sessions?
    const [qerr, qres] = await query(`
        INSERT INTO user (
            type, state, email, username, password,
            transfer_limit_period, transfer_limit_start, transfer_limit_end, transfer_limit_bytes
        ) VALUES (
           :type, :state, :email, :username, :password,
           :transfer_limit_period, :transfer_limit_start, :transfer_limit_end, :transfer_limit_bytes
        )
    `, value).then(() => query(`
        SELECT ${config.db.exposed.user.join(',')}
            FROM user
            WHERE username = ?
            LIMIT 1
    `, value.username));

    if (qerr || !qres.length) {
        return res.sendStatus(500);
    }

    res.respond(qres[0]);
};
