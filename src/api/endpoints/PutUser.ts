import Joi from '@hapi/joi';
import {hash} from 'bcrypt';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

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

export const putUser = endpoint(async (req, res) => {
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
    const other = await db.user.findMany({
        where: {
            OR: [
                {username: value.username},
                {email: value.email}
            ]
        }
    });

    if (other.length) {
        const [user] = other;

        // Check if username or email were already in use
        if (user.username === value.username) {
            return res.error('Username is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_USERNAME);
        } else if (user.email === value.email) {
            return res.error('Email is already in use', Status.CONFLICT, ErrorCode.DUPLICATE_EMAIL);
        }

        // I have no Idea how we would get here
        return res.internalError();
    }

    // Update user in db
    // TODO: Invalidate all sessions?
    // TODO: Better error-handling with prisma?
    const user = await db.user.create({
        select: config.db.exposed.user,
        data: value
    });

    return res.respond(user);
});
