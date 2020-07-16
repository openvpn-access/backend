import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import Joi from '@hapi/joi';
import {config} from '../../config';
import {query} from '../../db';
import {pick} from '../../utils/pick';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {secureUid} from '../../utils/uid';

const Payload = Joi.object({
    id: Joi.string(),
    password: Joi.string(),
    token: Joi.string()
}).xor('id', 'token').xor('password', 'token');

export const postLogin = async (req: Request, res: Response): Promise<unknown> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error('Invalid payload', Status.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_PAYLOAD);
    }

    const {id, password, token} = value;

    // Try loggin in using the token
    if (token) {
        const [qerr, qres] = await query(`
            SELECT u.*
                FROM user u, web_session us
                WHERE token = ?
                LIMIT 1
        `, [token]);

        if (!qerr && qres.length) {
            return res.respond({
                token,
                user: pick(qres[0], ...config.db.exposed.user)
            });
        }

        return res.error('Invalid token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    const ipAddr = req.ip;
    const [, users] = await query(`
        SELECT * FROM user
            WHERE username = ?
               OR email = ?
            LIMIT 1;
    `, [id, id]);

    // Not found
    if (!users.length) {

        // Save login attempt
        await query(`
            INSERT INTO web_login_attempt (state, username, ip_addr)
                VALUES (?, ?, ?)
        `, ['fail', id, ipAddr]);

        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    // Check if user exeeded the login-attempt limit
    const [, loginAttempts] = await query(`
        SELECT COUNT(*) AS count
            FROM web_login_attempt
                WHERE username = ?
                    AND state = 'fail'
                    AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL ? SECOND) AND CURDATE();
     `, [id, config.security.loginAttemptsTimeRange]);

    if (!loginAttempts || loginAttempts[0].count >= config.security.loginAttempts) {

        // Account locked
        return res.error('Account locked, try again later.', Status.LOCKED, ErrorCode.LOCKED_ACCOUNT);
    }

    // Compare passwords
    const [user] = users;
    if (await bcrypt.compare(password, user.password)) {

        // Create session key and add session
        const token = await secureUid(config.security.apiKeySize);
        await query(`
            INSERT INTO web_session (user_id, token, ip_addr)
                VALUES (?, ?, ?)
        `, [user.id, token, ipAddr]);

        // Save login attempt
        await query(`
            INSERT INTO web_login_attempt (user_id, state, username, ip_addr)
                VALUES (?, ?, ?, ?)
        `, [user.id, 'pass', id, ipAddr]);

        // Grab newly inserted user
        const [qerr, qres] = await query(`
            SELECT ${config.db.exposed.user.join(',')}
                FROM user
                WHERE id = ?
        `, [user.id]);

        // Errored or empty result
        if (qerr || !qres.length) {
            return res.sendStatus(500);
        }

        return res.respond({
            token,
            user: qres[0]
        });
    }

    // Save login attempt
    await query(`
        INSERT INTO web_login_attempt (user_id, state, username, ip_addr)
            VALUES (?, ?, ?, ?)
    `, [user.id, 'fail', id, ipAddr]);

    // Forbidden
    res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
};
