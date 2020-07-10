import {Server} from 'hapi';
import Joi from '@hapi/joi';
import {compare, hash} from 'bcrypt';
import validator from 'validator';
import {config} from '../config';
import {query} from '../db';
import {DBUser} from '../db/types';
import {createError} from '../utils/error';
import {STATUS} from '../utils/status';
import isEmail = validator.isEmail;

type PatchUserPayload = {
    username?: string;
    email?: string;
    type?: DBUser['type'],
    password?: string;
    currentPassword?: string;
};

export const patchUser = (server: Server): void => {
    server.route({
        method: 'PUT',
        path: '/users/{user}',
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().allow(''),
                    email: Joi.string().allow(''),
                    type: Joi.string().valid('user', 'admin'),
                    password: Joi.string().allow(''),
                    currentPassword: Joi.string().allow('')
                })
            }
        },
        async handler(req, rt) {
            const caller = req.auth.credentials.user as DBUser;
            const data = req.payload as PatchUserPayload;
            const {user} = req.params;

            const {
                username = caller.username,
                email = caller.email,
                type = caller.type,
                currentPassword // TODO: Conver to snake case
            } = data;

            // TODO: Create universal schema validation class
            if (user === 'admin' && caller.username === 'admin' && username !== 'admin') {
                return createError('The admin cannot change its username.', STATUS.FORBIDDEN, 1, 'username'); // TODO: Move error codes to module
            } else if (!isEmail(email)) {
                return createError('Invalid E-Mail.', STATUS.UNPROCESSABLE_ENTITY, 3, 'email');
            } else if (!username.match(/^[\w]*$/)) {
                return createError('Username can only contain alphanumeric characters.', STATUS.UNPROCESSABLE_ENTITY, 4, 'username');
            } else if (!username.length) {
                return createError('Username cannot be empty.', STATUS.BAD_REQUEST, 6);
            } else if (username.length > 50) {
                return createError('Username must be below 50 characters.', STATUS.UNPROCESSABLE_ENTITY, 7, 'username');
            } else if (data.password && (data.password.length < 8 || data.password.length > 50)) {
                return createError('Passwort must have a length between 8 and 50', STATUS.UNPROCESSABLE_ENTITY, 5, 'password');
            }

            // Validate password
            if (
                currentPassword && !(await compare(currentPassword, caller.password)) ||
                (caller.type === 'admin' && username !== 'admin' && data.password !== undefined)
            ) {
                return createError('Invalid password', STATUS.FORBIDDEN, 2, 'currentPassword');
            }

            // Update user in db
            const newPassword = data.password ? await hash(data.password, config.security.saltRounds) : caller.password;
            await query(`
                UPDATE user
                    SET username = ?,
                        email = ?,
                        type = ?,
                        password = ?
                    WHERE username = ?;
            `, [username, email, type, newPassword, user]); // TODO: Invalidate all sessions?

            return rt.response(

                // TODO: Move to utility?
                (await query(`
                    SELECT id, created_at, updated_at, type, state, email, email_verified, username
                        FROM user
                        WHERE username = ?
                `, user))[0]
            ).code(STATUS.OK);
        }
    });
};
