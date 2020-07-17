import {NextFunction, Request, Response} from 'express';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {DBUser} from '../../db/types';

declare module 'express-serve-static-core' {
    interface Request {
        session: {
            user: DBUser;
        }
    }
}

/**
 * Authenticates a client using the baerer token.
 * If the token is valid req.session.user will be a DBUser object.
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {authorization} = req.headers;
    const token = authorization && authorization.slice(7);
    if (!token) {
        return res.error('Missing baerer token', Status.BAD_REQUEST, ErrorCode.MISSING_TOKEN);
    }

    const session = await db.web_session.findOne({
        where: {token},
        select: {
            token: true,
            user: {
                select: config.db.exposed.user
            }
        }
    });

    if (!session) {
        return res.error('Invalid baerer token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    req.session = {user: session.user as unknown as DBUser};
    next();
};
