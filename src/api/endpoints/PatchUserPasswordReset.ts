import {hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    new_password: Joi.string()
        .min(8)
        .max(50)
        .regex(/^[^\s]+$/),

    token: Joi.string()
});

export const patchUserPasswordReset = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error(error, Status.BAD_REQUEST, ErrorCode.INVALID_PAYLOAD);
    }

    // Validate token
    const token = await db.user_access_token.findOne({
        where: {token: value.token}
    });

    // TODO: Manually checking the type might not be the best solution?!
    if (!token || token.type !== 'reset_password') {
        return res.error('Invalid password reset token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    // Update password
    // TODO: Invalidate all sessions?
    await db.user.update({
        select: config.db.exposed.user,
        data: {password: await hash(value.new_password, config.security.saltRounds)},
        where: {id: token.user_id}
    });

    // Remove all password-reset related tokens for this user
    await db.user_access_token.deleteMany({
        where: {
            user_id: token.user_id,
            type: 'reset_password'
        }
    });

    return res.respond();
});
