import {compare, hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    type: Joi.string()
        .valid('user', 'admin'),

    activated: Joi.boolean(),

    email: Joi.string()
        .email(),

    username: Joi.string()
        .min(3)
        .max(50)
        .regex(/^[\w.]+$/),

    password: Joi.string()
        .min(8)
        .max(50)
        .regex(/^[^\s]+$/),

    transfer_limit_period: Joi.alternatives(Joi.number(), null),
    transfer_limit_start: Joi.alternatives(Joi.date(), null),
    transfer_limit_end: Joi.alternatives(Joi.date(), null),
    transfer_limit_bytes: Joi.alternatives(Joi.number(), null),

    current_password: Joi.string()
});

export const patchUser = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    const caller = req.session.user;
    const {id} = req.params;

    // Find user to update
    const toPatch = await db.user.findOne({where: {id: Number(id)}});
    if (!toPatch) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    // The administrator cannot change its username
    if (toPatch.type === 'admin' && caller.username === 'admin' && value.username !== undefined && value.username !== 'admin') {
        return res.error('The admin cannot change its username.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
    }

    // Users can only change themselves
    if (caller.type === 'user' && caller.username !== toPatch.username) {
        return res.error('Users can only change themselves.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
    }

    // Administrators can only change non-password fields
    if (caller.type === 'admin' && caller.username !== toPatch.username && value.password !== undefined) {
        return res.error('Password cannot be changed by administrators.', Status.FORBIDDEN, ErrorCode.LOCKED_PASSWORD);
    }

    // Validate password
    if (value.current_password && !(await compare(value.current_password, caller.password))) {
        return res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
    }

    // Not part of the user-table
    delete value.current_password;

    // pre-process password
    if (value.password) {
        value.password = await hash(value.password, config.security.saltRounds);
    }

    // Update user in db
    // TODO: Invalidate all sessions?
    return db.user.update({
        select: config.db.exposed.user,
        data: {
            ...toPatch,
            ...value,
            ...(value.email && value.email !== toPatch.email && {
                email_verified: false
            })
        },
        where: {
            username: toPatch.username
        }
    }).then(data => {
        return res.respond(data);
    }).catch(e => {

        // TODO: This code is a duplicate as seen in PutUser, abstract that somehow
        if (e.code === 'P2002') {
            const field = e.code.meta.target;

            if (field === 'username') {
                return res.error('This username is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME);
            } else if (field === 'email') {
                return res.error('This email is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL);
            }
        }

        throw e;
    });
});
