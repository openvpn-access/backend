import Joi from 'joi';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const postUserEmailVerify = createEndpoint({
    method: 'POST',
    route: '/users/email/verify',

    validation: {
        body: Joi.object({
            token: Joi.string()
                .required()
        })
    },

    async handle(req, res) {
        const {body} = req;

        // Validate token
        const token = await db.user_access_token.findOne({
            where: {token: body.token}
        });

        if (!token || token.type !== 'verify_email') {
            return res.error('Invalid email verification token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
        }

        // Mark this user's email address as valid
        await db.user.update({
            where: {id: token.user_id},
            data: {email_verified: true}
        });

        // Remove all associated, pending email-verifications for this email
        await db.user_access_token.deleteMany({
            where: {user_id: token.user_id}
        });

        return res.respond();
    }
});
