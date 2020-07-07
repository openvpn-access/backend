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

// TODO: Use Boom
// TODO: Create db api wrapper?
// TODO: Add ip_addr to user session?
export const login = (server: Server): void => {
    server.route({
        method: 'POST',
        path: '/login',
        options: {
            auth: false,
            validate: {
                payload: Joi.object({
                    id: Joi.string().required(),
                    password: Joi.string().required()

                    // TODO: Login using a token?
                })
            }
        },
        async handler(req, rt) {
            const {id, password} = req.payload as LoginPayload;
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
                return rt.response({
                    message: 'User not found'
                }).code(404);
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
                return rt.response({
                    message: 'Account locked, try again later.'
                }).code(423);
            }

            // Compare passwords
            const [user] = users;
            if (await bcrypt.compare(password, user.password)) {

                // Create session key and add session
                const token = await secureUid(config.security.apiKeySize);
                await query(`
                    INSERT INTO user_session (user_id, token)
                        VALUES ((?), (?))
                `, [user.id, token]);

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
            return rt.response({
                message: 'Invalid password'
            }).code(403);
        }
    });
};
