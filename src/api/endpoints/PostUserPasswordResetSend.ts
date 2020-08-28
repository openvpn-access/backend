import Joi from 'joi';
import {config} from '../../config';
import {baseUrl, baseUrlHost} from '../../constants';
import {db} from '../../db';
import {emailTemplates, sendMail} from '../../mail';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

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

        // TODO: This is an attack-vector: It takes way longer if the email is valid / in use.
        // Send password-reset email
        if (user) {

            // Create verification token
            const token = await db.user_access_token.create({
                data: {
                    type: 'reset_password',
                    user: {connect: {id: user.id}},
                    token: await secureUid(config.security.tokenSize)
                }
            });

            // Send email
            return sendMail({
                to: user.email,
                subject: 'Password Reset Request for OpenVPN Access',
                html: emailTemplates.resetPassword({
                    host: baseUrlHost,
                    link: `${baseUrl}/reset-password?user=${user.id}&token=${token.token}`,
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
