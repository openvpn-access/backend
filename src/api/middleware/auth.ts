import * as prism from '@prisma/client';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {middleware} from '../framework';

declare module 'express-serve-static-core' {
    interface Request {
        session: {
            token: string;
            user: prism.user;
        }
    }
}

/**
 * Authenticates a client using the baerer token.
 * If the token is valid req.session.user will be a DBUser object.
 */
export const auth = middleware(async (req, res) => {
    const {authorization} = req.headers;
    const token = authorization && authorization.slice(7);
    if (!token) {
        return res.error('Missing baerer token', Status.BAD_REQUEST, ErrorCode.MISSING_TOKEN);
    }

    const session = await db.web_session.findOne({
        where: {token},
        select: {
            token: true,
            user: true
        }
    });

    if (!session) {
        return res.error('Invalid baerer token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    req.session = session;
});
