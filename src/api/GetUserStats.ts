import {Request, Response} from 'express';
import {query} from '../db';
import {DBUser} from '../db/types';
import {ErrorCode} from './enums/ErrorCode';
import {Status} from './enums/Status';

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
    const caller = req.session.user as DBUser;

    // Only admins are allowed to fetch users
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED, ErrorCode.NOT_ADMIN);
    }

    const [, qres] = await query(`
        SELECT COUNT(*) as count
            FROM user
    `);

    return res.respond({
        total_users_count: qres[0].count
    });
};
