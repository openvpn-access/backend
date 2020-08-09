import {hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {resolveDBError} from '../../db/resolve-error';
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
                .email({tlds: false, minDomainSegments: 1})
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
            const resolved = resolveDBError(e);
            if (resolved) {
                return res.error(...resolved);
            }

            throw e;
        });
    }
});
