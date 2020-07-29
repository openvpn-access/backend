import bcrypt from 'bcrypt';
import Joi from 'joi';
import {authenticator} from 'otplib';
import {config} from '../../config';
import {db} from '../../db';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const postLogin = createEndpoint({
    method: 'POST',
    route: '/login',

    validation: {
        body: Joi.object({
            login_id: Joi.string(),
            password: Joi.string(),
            token: Joi.string(),
            mfa_code: Joi.string()
        }).xor('login_id', 'token').xor('password', 'token')
    },

    async handle(req, res) {
        const {login_id, password, token, mfa_code} = req.body;

        // Try loggin in using the token
        if (token) {
            const session = await db.web_session.findOne({
                where: {token},
                select: {
                    token: true,
                    user: {
                        select: config.db.exposed.user
                    }
                }
            });

            if (session) {
                return res.respond(session);
            }

            return res.error('Invalid token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
        }

        const ipAddr = req.ip;
        const [user] = await db.user.findMany({
            where: {
                OR: [
                    {username: login_id},
                    {email: login_id}
                ]
            }
        });

        // Not found
        if (!user) {

            // Save login attempt // TODO: Clean up login-attempt logging
            await db.web_login_attempt.create({
                data: {
                    login_id,
                    ip_addr: ipAddr,
                    state: 'fail'
                }
            });

            return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
        }

        // Check if user exeeded the login-attempt limit
        const loginAttempts = await db.web_login_attempt.count({
            where: {
                user_id: user.id,
                state: 'fail',
                created_at: {
                    gt: new Date(Date.now() - config.security.loginAttemptsTimeRange * 1000)
                }
            }
        });

        if (loginAttempts >= config.security.loginAttempts) {

            // Save login attempt
            await db.web_login_attempt.create({
                data: {
                    user: {connect: {id: user.id}},
                    login_id,
                    ip_addr: ipAddr,
                    state: 'fail'
                }
            });

            // Account locked
            return res.error('Account locked, try again later.', Status.LOCKED, ErrorCode.LOCKED_ACCOUNT);
        }

        // Compare passwords
        if (await bcrypt.compare(password, user.password)) {

            // Check MFA token (if set)
            if (user.mfa_activated && (
                !mfa_code ||
                !authenticator.check(mfa_code, user.mfa_secret as string)
            )) {

                // Save login attempt
                await db.web_login_attempt.create({
                    data: {
                        user: {connect: {id: user.id}},
                        login_id,
                        ip_addr: ipAddr,
                        state: 'fail'
                    }
                });

                return res.error('Invalid MFA code.', Status.UNAUTHORIZED, ErrorCode.INVALID_MFA_CODE);
            }

            // Create session key and add session
            const token = await secureUid(config.security.tokenSize);
            await db.web_session.create({
                data: {
                    user: {connect: {id: user.id}},
                    token,
                    ip_addr: ipAddr
                }
            });

            // Save login attempt
            await db.web_login_attempt.create({
                data: {
                    user: {connect: {id: user.id}},
                    state: 'pass',
                    login_id: user.username,
                    ip_addr: ipAddr
                }
            });

            return res.respond({
                token,
                user: await db.user.findOne({
                    select: config.db.exposed.user,
                    where: {id: user.id}
                })
            });
        }

        // Save login attempt
        await db.web_login_attempt.create({
            data: {
                user: {connect: {id: user.id}},
                state: 'fail',
                login_id,
                ip_addr: ipAddr
            }
        });

        // Forbidden
        return res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
    }
});
