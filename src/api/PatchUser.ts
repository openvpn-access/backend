import {Server} from 'hapi';
import Joi from '@hapi/joi';
import Boom from '@hapi/boom';
import {hash} from 'bcrypt';
import {config} from '../config';
import {query} from '../db';
import {DBUser} from '../db/types';

type PatchUserPayload = {
    username?: string;
    email?: string;
    password?: string;
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
                    password: Joi.string()
                })
            }
        },
        async handler(req, rt) {
            const user = req.auth.credentials.user as DBUser;

            const {
                username = user.username,
                email = user.email,
                password = user.password
            } = req.payload as PatchUserPayload;

            if (user.username === 'admin' && username !== 'admin') {
                return Boom.forbidden('The admin cannot change its username.');
            }

            // Update user in db
            const newPassword = password ? await hash(password, config.security.saltRounds) : user.password;
            await query(`
                UPDATE user
                    SET username = (?),
                        email = (?),
                        password = (?)
                    WHERE username = (?);
            `, [username, email, newPassword, username]);

            return rt.response().code(200);
        }
    });
};
