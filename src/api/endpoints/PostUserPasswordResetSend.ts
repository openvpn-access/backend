import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {emailTemplates, sendMail} from '../../mail';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

const isDev = process.env.NODE_ENV === 'development';
export const postUserPasswordResetSend = createEndpoint({
    method: 'POST',
    route: '/users/password/reset/send',

    validation: {
        body: Joi.object({
            email: Joi.string()
        })
    },

    async handle(req, res) {
        const {body} = req;

        // Find user with this email
        const user = await db.user.findOne({
            where: {email: body.email}
        });

        // TODO: This is an attach-vector: It takes way longer if the email is valid!
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
            return sendMail({
                to: user.email,
                subject: 'Password Reset Request for OpenVPN Access',
                html: emailTemplates.resetPassword({
                    host, link,
                    username: user.username
                })
            }).then(() => {
                return res.respond();
            }).catch(() => {
                return res.error('Failed to send email', Status.UNPROCESSABLE_ENTITY, ErrorCode.EMAIL_FAILED_TO_DELIVER);
            });
        }

        // Respond always with 200 (for security purposes)
        return res.respond();
    }
});
