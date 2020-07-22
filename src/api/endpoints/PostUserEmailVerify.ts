import Joi from 'joi';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    token: Joi.string()
        .required()
});

export const postUserEmailVerify = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);

    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Validate token
    const token = await db.user_email_verification.findOne({
        where: {token: value.token}
    });

    if (!token) {
        return res.error(`Invalid email verification token`, Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    // Mark this user's email address as valid
    await db.user.update({
        where: {id: token.user_id},
        data: {email_verified: true}
    });

    // Remove all associated, pending email-verifications for this email
    await db.user_email_verification.deleteMany({
        where: {user_id: token.user_id}
    });

    return res.respond();
});
