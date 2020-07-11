import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import Joi from '@hapi/joi';
import {config} from '../config';
import {query} from '../db';
import {omit} from '../utils/pick';
import {Status} from '../utils/status';
import {secureUid} from '../utils/uid';

type LoginPayload = {
    password?: string;
    id?: string;
    token?: string;
};

const Payload = Joi.object({
    id: Joi.string(),
    password: Joi.string(),
    token: Joi.string()
}).xor('id', 'token').xor('password', 'token');

export const login = async (req: Request, res: Response): Promise<void> => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error('Invalid payload', Status.UNPROCESSABLE_ENTITY);
    }

    const {id, password, token} = value as LoginPayload;

    // Try loggin in using the token
    if (token) {
        const res = await query(`
            SELECT u.*
                FROM user u, user_session us
                WHERE token = ?
                LIMIT 1
        `, [token]);

        if (res.length) {
            return res.respond({
                token,
                user: omit(res[0], ['password'])
            });
        }

        return res.error('Invalid token', Status.UNAUTHORIZED);
    }

    const ipAddr = req.ip;
    const users = await query(`
        SELECT * FROM user
            WHERE username = ?
            LIMIT 1;
    `, [id]);

    // Not found
    if (!users.length) {

        // Save login attempt
        await query(`
            INSERT INTO login_attempt_web (state, username, ip_addr)
                VALUES (?, ?, ?)
        `, ['fail', id, ipAddr]);

        return res.error('User not found', Status.NOT_FOUND);
    }

    // Check if user exeeded the login-attempt limit
    const loginAttempts = await query(`
        SELECT COUNT(*) AS count
            FROM login_attempt_web
                WHERE username = ?
                    AND state = 'fail'
                    AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL ? SECOND) AND CURDATE();
     `, [id, config.security.loginAttemptsTimeRange]);

    if (!loginAttempts || loginAttempts[0].count >= config.security.loginAttempts) {

        // Account locked
        return res.error('Account locked, try again later.', Status.LOCKED);
    }

    // Compare passwords
    const [user] = users;
    if (await bcrypt.compare(password, user.password)) {

        // Create session key and add session
        const token = await secureUid(config.security.apiKeySize);
        await query(`
            INSERT INTO user_session (user_id, token, ip_addr)
                VALUES (?, ?, ?)
        `, [user.id, token, ipAddr]);

        // Save login attempt
        await query(`
            INSERT INTO login_attempt_web (user_id, state, username, ip_addr)
                VALUES (?, ?, ?, ?)
        `, [user.id, 'pass', id, ipAddr]);

        // Okay
        return res.respond({
            token,
            user: omit(user, ['password'])
        });
    }

    // Save login attempt
    await query(`
        INSERT INTO login_attempt_web (user_id, state, username, ip_addr)
            VALUES (?, ?, ?, ?)
    `, [user.id, 'fail', id, ipAddr]);

    // Forbidden
    return res.error('Invalid password', Status.UNAUTHORIZED);
};
