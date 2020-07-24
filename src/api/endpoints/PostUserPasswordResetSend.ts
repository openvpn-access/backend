import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {emailTemplates, sendMail} from '../../mail';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    email: Joi.string()
});

const isDev = process.env.NODE_ENV === 'development';
export const postUserPasswordResetSend = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Find user with this email
    const user = await db.user.findOne({
        where: {email: value.email}
    });

    // Send password-reset email
    if (user) {

        // Create verification token
        const token = await db.user_access_token.create({
            data: {
                type: 'reset_password',
                user: {connect: {id: user.id}},
                token: await secureUid(config.security.apiKeySize)
            }
        });

        // TODO: Use some sort of appname or just plain OpenVPN Access?
        const host = config.server.host + (isDev ? ':3000' : '');
        const link = `${isDev ? 'http' : 'https'}://${host}/reset-password?user=${user.id}&token=${token.token}`;

        // Send email
        await sendMail({
            to: user.email,
            subject: 'Password Reset Request for OpenVPN Access',
            html: emailTemplates.resetPassword({
                host, link,
                username: user.username
            })
        });
    }

    // Respond always with 200 (for security purposes)
    return res.respond();
});
