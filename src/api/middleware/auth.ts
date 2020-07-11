import {NextFunction, Request, Response} from 'express';
import {query} from '../../db';
import {Status} from '../../utils/status';
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
        return res.error('Missing baerer token', Status.BAD_REQUEST);
    }

    const users = await query(`
        SELECT u.*
            FROM user u, user_session us
            WHERE us.token = ?
            LIMIT 1
    `, [token]);

    if (!users.length) {
        return res.error('Invalid baerer token', Status.UNAUTHORIZED);
    }

    req.session = {user: users[0]};
    next();
};
