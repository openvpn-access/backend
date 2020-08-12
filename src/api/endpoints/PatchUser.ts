import {compare, hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {resolveDBError} from '../../db/resolve-error';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const patchUser = createEndpoint({
    method: 'PATCH',
    route: '/users/:user_id',
    middleware: bearer,

    validation: {
        body: Joi.object({
            type: Joi.string()
                .valid('user', 'admin'),

            activated: Joi.boolean(),
            mfa_activated: Joi.boolean(),

            email: Joi.string()
                .email({tlds: false, minDomainSegments: 1}),

            username: Joi.string()
                .min(3)
                .max(50)
                .regex(/^[\w.]+$/),

            password: Joi.string()
                .min(8)
                .max(50)
                .regex(/^[^\s]+$/),

            transfer_limit_period: Joi.alternatives(Joi.number().positive(), null),
            transfer_limit_bytes: Joi.alternatives(Joi.number().positive(), null),
            transfer_limit_start: Joi.alternatives(Joi.date().iso(), null),
            transfer_limit_end: Joi.alternatives(
                Joi.date().iso().greater(Joi.ref('transfer_limit_start')),
                null
            ).default(null),

            current_password: Joi.string()
        }),

        params: Joi.object({
            user_id: Joi.number()
        })
    },

    async handle(req, res) {
        const caller = req.session.user;
        const {body} = req;
        const {user_id} = req.params;

        // Find user to update
        const toPatch = await db.user.findOne({where: {id: user_id}});
        if (!toPatch) {
            return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
        }

        // The administrator cannot change its username
        if (toPatch.type === 'admin' && caller.username === 'admin' && body.username !== undefined && body.username !== 'admin') {
            return res.error('The admin cannot change its username.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
        }

        // Users can only change themselves
        if (caller.type === 'user' && caller.username !== toPatch.username) {
            return res.error('Users can only change themselves.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
        }

        // Administrators can only change non-password fields
        if (caller.type === 'admin' && caller.username !== toPatch.username && body.password !== undefined) {
            return res.error('Password cannot be changed by administrators.', Status.FORBIDDEN, ErrorCode.LOCKED_PASSWORD);
        }

        // Validate password
        if (body.current_password && !(await compare(body.current_password, caller.password))) {
            return res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
        }

        // MFA Can only get deactivated
        if (caller.type === 'admin' && body.mfa_activated && !toPatch.mfa_activated) {
            return res.error('MFA Can only be activated by the user.', Status.UNAUTHORIZED, ErrorCode.MFA_INVALID_ACTION);
        }

        // Not part of the user-table
        delete body.current_password;

        // pre-process password
        if (body.password) {
            body.password = await hash(body.password, config.security.saltRounds);

            // Invalidate other sessions
            await db.web_session.deleteMany({
                where: {
                    user_id: toPatch.id,
                    NOT: {token: req.session.token}
                }
            });
        }

        // Update user in db
        return db.user.update({
            select: config.db.exposed.user,
            data: {
                ...body,
                ...(body.email && body.email !== toPatch.email && {
                    email_verified: false
                })
            },
            where: {id: toPatch.id}
        }).then(data => {
            return res.respond(data);
        }).catch(e => {
            const resolved = resolveDBError(e);
            if (resolved) {
                return res.error(...resolved);
            }

            throw e;
        });
    }
});
