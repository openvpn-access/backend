import Joi from 'joi';
import {authenticator} from 'otplib';
import QRCode from 'qrcode';
import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const postUserMFAGenerate = createEndpoint({
    method: 'POST',
    route: '/users/:user_id/mfa/generate',
    middleware: bearer,

    validation: {
        params: Joi.object({
            user_id: Joi.string()
        })
    },

    async handle(req, res) {
        const {user_id} = req.params;
        const {user} = req.session;

        if (user.type !== 'admin' && user.id !== user_id) {
            return res.error('Users, except for admins, can only generate mfa-tokens for themselves.', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
        }

        // Save mfa secret if
        let secret = user.mfa_secret;
        if (!secret) {
            secret = authenticator.generateSecret();
            await db.user.update({
                data: {mfa_secret: secret},
                where: {id: user_id}
            });
        }

        const url = authenticator.keyuri(user.username, 'OpenVPN Access', secret); // TODO: Use brand name here too?
        const qr_code = await QRCode.toString(url, {type: 'svg'});
        return res.respond({secret, url, qr_code});
    }
});


