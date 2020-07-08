import {Server} from 'hapi';
import Joi from '@hapi/joi';
import {compare, hash} from 'bcrypt';
import validator from 'validator';
import {config} from '../config';
import {query} from '../db';
import {DBUser} from '../db/types';
import {createError} from '../utils/error';
import isEmail = validator.isEmail;

type PatchUserPayload = {
    username?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
};

export const patchUser = (server: Server): void => {
    server.route({
        method: 'PUT',
        path: '/user/{user}',
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string(),
                    email: Joi.string(),
                    password: Joi.string(),
                    currentPassword: Joi.string().required()
                })
            }
        },
        async handler(req, rt) {
            const caller = req.auth.credentials.user as DBUser;
            const data = req.payload as PatchUserPayload;

            const {
                username = caller.username,
                email = caller.email,
                currentPassword
            } = data;

            // TODO: Create universal schema validation class
            if (caller.username === 'admin' && username !== 'admin') {
                return createError('The admin cannot change its username.', 403, 1);
            } else if (!isEmail(email)) {
                return createError('Invalid E-Mail.', 400, 3);
            } else if (!username.match(/^[\w]{1,50}$/)) {
                return createError('Username can only contain alphanumeric characters and must have a length between 1 and 50.', 400, 4);
            } else if (data.password && (data.password.length < 8 || data.password.length > 50)) {
                return createError('Passwort must have a length between 8 and 50', 400, 5);
            }

            // Validate password
            if (
                !(currentPassword && await compare(currentPassword, caller.password)) ||
                (caller.type === 'admin' && username !== 'admin' && data.password !== undefined)
            ) {
                return createError('Invalid password', 403, 2);
            }

            // Update user in db
            const newPassword = data.password ? await hash(data.password, config.security.saltRounds) : caller.password;
            await query(`
                UPDATE user
                    SET username = (?),
                        email = (?),
                        password = (?)
                    WHERE id = (?);
            `, [username, email, newPassword, caller.id]); // TODO: Invalidate all sessions?

            return rt.response().code(200);
        }
    });
};
