import {NextFunction, Request, Response} from 'express';
import {query} from '../../db';
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

    const [, users] = await query(`
        SELECT u.*
            FROM user u, web_session us
            WHERE us.token = ?
            LIMIT 1
    `, [token]);

    if (!users.length) {
        return res.error('Invalid baerer token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
    }

    req.session = {user: users[0]};
    next();
};
