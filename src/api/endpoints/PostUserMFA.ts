import Joi from 'joi';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    login_id: Joi.string()
});

export const postUserMFA = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);
    if (error) {
        return res.error('Invalid payload', Status.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_PAYLOAD);
    }

    const [user] = await db.user.findMany({
        where: {
            OR: [
                {username: value.id},
                {email: value.id}
            ]
        }
    });

    if (!user) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    return res.respond({
        mfa_required: user.mfa_activated
    });
});
