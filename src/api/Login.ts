import {Server} from 'hapi';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import {config} from '../config';
import {query} from '../db';
import {pick} from '../utils/pick';
import {secureUid} from '../utils/uid';

type LoginPayload = {
    password: string;
    id: string;
};

export const login = (server: Server): void => {
    server.route({
        method: 'POST',
        path: '/login',
        options: {
            validate: {
                payload: Joi.object({
                    id: Joi.string().required(),
                    password: Joi.string().required()
                })
            }
        },
        async handler(req, rt) {
            const {id, password} = req.payload as LoginPayload;
            const users = await query(`
                SELECT * FROM user
                    WHERE username = (?)
                LIMIT 1;
            `, [id]);

            // Not found
            if (!users.length) {

                // TODO: Move error handler to module
                return rt.response({
                    message: 'User not found'
                }).code(404);
            }

            // Compare passwords
            const [user] = users;
            if (await bcrypt.compare(password, user.password)) {

                // Create session key and add session
                const sessionKey = await secureUid(config.security.apiKeySize);
                await query(`
                    INSERT INTO user_session (user_id, session_key)
                        VALUES ((?), (?))
                `, [user.id, sessionKey]);

                // Okay
                return {
                    key: sessionKey,
                    user: pick(user, ['type', 'state', 'email', 'username'])
                };
            }

            // Forbidden
            return rt.response({
                message: 'Invalid password'
            }).code(403);
        }
    });
};
