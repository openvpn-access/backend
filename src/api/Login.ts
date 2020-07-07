import {Server} from 'hapi';
import Joi from '@hapi/joi';
import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import {config} from '../config';
import {query} from '../db';
import {pick} from '../utils/pick';
import {secureUid} from '../utils/uid';

type LoginPayload = {
    password?: string;
    id?: string;
    token?: string;
};

export const login = (server: Server): void => {
    server.route({
        method: 'POST',
        path: '/login',
        options: {
            auth: false,
            validate: {
                payload: Joi.object({
                    id: Joi.string(),
                    password: Joi.string(),
                    token: Joi.string()
                }).xor('id', 'token').xor('password', 'token')
            }
        },
        async handler(req) {
            const {id, password, token} = req.payload as LoginPayload;

            // Try loggin in using the token
            if (token) {
                const res = await query(`
                    SELECT u.*
                        FROM user u, user_session us
                        WHERE token = (?)
                        LIMIT 1
                `, [token]);

                if (res.length) {
                    return {
                        token,
                        user: pick(res[0], ['type', 'state', 'email', 'username'])
                    };
                }

                return Boom.unauthorized('Invalid token');
            }

            const ipAddr = req.info.remoteAddress;
            const users = await query(`
                SELECT * FROM user
                    WHERE username = (?)
                LIMIT 1;
            `, [id]);

            // Not found
            if (!users.length) {

                // Save login attempt
                await query(`
                    INSERT INTO login_attempt_web (state, username, ip_addr)
                        VALUES ((?), (?), (?))
                `, ['fail', id, ipAddr]);

                // TODO: Move error handler to module
                return Boom.notFound('User not found');
            }

            // Check if user exeeded the login-attempt limit
            const loginAttempts = await query(`
                SELECT COUNT(*) AS count
                    FROM login_attempt_web
                        WHERE username = (?)
                            AND state = 'fail'
                            AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL (?) SECOND) AND CURDATE();
            `, [id, config.security.loginAttemptsTimeRange]);

            if (!loginAttempts || loginAttempts[0].count >= config.security.loginAttempts) {

                // Account locked
                return Boom.locked('Account locked, try again later.');
            }

            // Compare passwords
            const [user] = users;
            if (await bcrypt.compare(password, user.password)) {

                // Create session key and add session
                const token = await secureUid(config.security.apiKeySize);
                await query(`
                    INSERT INTO user_session (user_id, token, ip_addr)
                        VALUES ((?), (?), (?))
                `, [user.id, token, ipAddr]);

                // Save login attempt
                await query(`
                    INSERT INTO login_attempt_web (user_id, state, username, ip_addr)
                        VALUES ((?), (?), (?), (?))
                `, [user.id, 'pass', id, ipAddr]);

                // Okay
                return {
                    token,
                    user: pick(user, ['type', 'state', 'email', 'username'])
                };
            }

            // Save login attempt
            await query(`
                    INSERT INTO login_attempt_web (user_id, state, username, ip_addr)
                        VALUES ((?), (?), (?), (?))
                `, [user.id, 'fail', id, ipAddr]);

            // Forbidden
            return Boom.forbidden('Invalid password');
        }
    });
};
