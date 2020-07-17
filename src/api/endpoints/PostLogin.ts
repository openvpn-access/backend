import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import Joi from '@hapi/joi';
import {config} from '../../config';
import {db} from '../../db';
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
                {username: id},
                {email: id}
            ]
        }
    });

    // Not found
    if (!user) {

        // Save login attempt
        await db.web_login_attempt.create({
            data: {
                username: id,
                ip_addr: ipAddr,
                state: 'fail'
            }
        });

        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    // Check if user exeeded the login-attempt limit
    const loginAttempts = await db.web_login_attempt.count({
        where: {
            username: id,
            state: 'fail',
            created_at: {
                lt: new Date(Date.now() - config.security.loginAttemptsTimeRange * 1000)
            }
        }
    });

    if (loginAttempts >= config.security.loginAttempts) {

        // Account locked
        return res.error('Account locked, try again later.', Status.LOCKED, ErrorCode.LOCKED_ACCOUNT);
    }

    // Compare passwords
    if (await bcrypt.compare(password, user.password)) {

        // Create session key and add session
        const token = await secureUid(config.security.apiKeySize);
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
                username: id,
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
            username: id,
            ip_addr: ipAddr
        }
    });

    // Forbidden
    res.error('Invalid password', Status.UNAUTHORIZED, ErrorCode.INVALID_PASSWORD);
};
