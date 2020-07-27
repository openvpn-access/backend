import Joi from 'joi';
import {authenticator} from 'otplib';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const patchUserMFA = createEndpoint({
    method: 'PATCH',
    route: '/users/:id/mfa',

    validation: {
        body: Joi.object({
            activate: Joi.boolean(),
            code: Joi.string().length(6)
        })
    },

    async handle(req, res) {
        const {body} = req;
        const user = await db.user.findOne({
            where: {id: Number(req.params.id)}
        });

        if (!user) {
            return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
        } else if (!user.mfa_secret) {
            return res.error('MFA is not set up yet.', Status.UNPROCESSABLE_ENTITY, ErrorCode.NOT_SET_UP);
        }

        if (!authenticator.check(body.code, user.mfa_secret)) {
            return res.error('Invalid code', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
        }

        await db.user.update({
            data: {mfa_activated: body.activate},
            where: {id: user.id}
        });

        return res.respond();
    }
});
