import {authenticator} from 'otplib';
import QRCode from 'qrcode';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

export const postUserMFAGenerate = endpoint(async (req, res) => {
    const {id} = req.params;
    const {user} = req.session;

    if (user.type !== 'admin' && user.id !== Number(id)) {
        return res.error('Users, except for admins, can only generate mfa-tokens for themselves.', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    // Save mfa secret if
    let secret = user.mfa_secret;
    if (!secret) {
        secret = authenticator.generateSecret();
        await db.user.update({
            data: {mfa_secret: secret},
            where: {id: user.id}
        });
    }

    const url = authenticator.keyuri(user.username, 'OpenVPN Access', secret); // TODO: Use brand name here too?
    const qr_code = await QRCode.toString(url, {type: 'svg'});
    return res.respond({secret, url, qr_code});
});


