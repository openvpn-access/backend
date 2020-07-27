import Joi from 'joi';
import {authenticator} from 'otplib';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

const Payload = Joi.object({
    activate: Joi.boolean(),
    code: Joi.string().length(6)
});

export const patchUserMFA = endpoint(async (req, res) => {
    const {error, value} = Payload.validate(req.body);

    if (error) {
        return res.error('Invalid payload', Status.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_PAYLOAD);
    }

    const user = await db.user.findOne({
        where: {id: Number(req.params.id)}
    });

    if (!user) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    } else if (!user.mfa_secret) {
        return res.error('MFA is not set up yet.', Status.UNPROCESSABLE_ENTITY, ErrorCode.NOT_SET_UP);
    }

    if (!authenticator.check(value.code, user.mfa_secret)) {
        return res.error('Invalid code', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    await db.user.update({
        data: {mfa_activated: value.activate},
        where: {id: user.id}
    });

    return res.respond();
});
