import {hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const putUser = createEndpoint({
    method: 'PUT',
    route: '/users',
    middleware: bearer,

    validation: {
        body: Joi.object({
            type: Joi.string()
                .valid('user', 'admin')
                .required(),

            activated: Joi.boolean(),

            email: Joi.string()
                .email()
                .required(),

            username: Joi.string()
                .min(3)
                .max(50)
                .regex(/^[\w.]+$/)
                .required(),

            password: Joi.string()
                .min(8)
                .max(50)
                .regex(/^[^\s]+$/)
                .required(),

            transfer_limit_period: Joi.alternatives(Joi.number(), null).default(null),
            transfer_limit_start: Joi.alternatives(Joi.date(), null).default(null),
            transfer_limit_end: Joi.alternatives(Joi.date(), null).default(null),
            transfer_limit_bytes: Joi.alternatives(Joi.number(), null).default(null)
        })
    },

    async handle(req, res) {
        const {body} = req;

        // Only administrators can add users
        const caller = req.session.user;
        if (caller.type !== 'admin') {
            return res.error('Only administrators can add users.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
        }

        // Hash password
        body.password = await hash(body.password, config.security.saltRounds);

        // Update user in db
        return db.user.create({
            select: config.db.exposed.user,
            data: body
        }).then(data => {
            return res.respond(data);
        }).catch(e => {
            if (e.code === 'P2002') {
                const field = e.meta.target;

                if (field === 'username') {
                    return res.error('This username is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME);
                } else if (field === 'email') {
                    return res.error('This email is already in use.', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL);
                }
            }

            throw e;
        });
    }
});
