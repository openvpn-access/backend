import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {emailTemplates, sendMail} from '../../mail';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';


const isDev = process.env.NODE_ENV === 'development';
export const postUserEmailVerifySend = createEndpoint({
    method: 'POST',
    route: '/users/email/verify/send',

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

        // Send verification email
        if (user && !user.email_verified) {

            // Create verification token
            const token = await db.user_access_token.create({
                data: {
                    type: 'verify_email',
                    user: {connect: {id: user.id}},
                    token: await secureUid(config.security.tokenSize)
                }
            });

            const host = config.server.host + (isDev ? ':3000' : '');
            const link = `${isDev ? 'http' : 'https'}://${host}/verify-email?email=${body.email}&token=${token.token}`;

            // Send email
            return sendMail({
                to: user.email,
                subject: 'Please verify your openvpn-access email address',
                html: emailTemplates.verifyEmail({
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
