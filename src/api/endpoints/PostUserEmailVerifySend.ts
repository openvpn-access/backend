import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {sendMail} from '../../mail';
import {secureUid} from '../../utils/uid';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    email: Joi.string()
});

const isDev = process.env.NODE_ENV === 'development';
export const postUserEmailVerifySend = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Find user with this email
    const user = await db.user.findOne({
        where: {email: value.email}
    });

    // Send verification email
    if (user && !user.email_verified) {

        // Create verification token
        const token = await db.user_email_verification.create({
            data: {
                user: {connect: {id: user.id}},
                token: await secureUid(config.security.apiKeySize),
            }
        });

        const host = config.server.host + (isDev ? ':3000' : '');
        const url = `${isDev ? 'http' : 'https'}://${host}/verify-email?email=${value.email}&token=${token.token}`;

        // Send email TODO: Make that more pretty
        await sendMail({
            to: user.email,
            subject: 'Please verify your vpn-access email address',
            text: `
You are receiving this because you (or someone else) requested that the email address of the '${user.username}' openvpn-access should be changed.

To confirm that this is the correct email for the '${user.username}' account, click the following link:

${url}
            `.trim(),
        });
    }

    // Respond always with 200 (for security purposes)
    return res.respond();
});
