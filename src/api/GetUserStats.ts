import {Request, Response} from 'express';
import {query} from '../db';
import {DBUser} from '../db/types';
import {Status} from '../utils/status';

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
    const caller = req.session.user as DBUser;

    // Only admins are allowed to fetch users
    if (caller.type !== 'admin') {
        return res.error('Not allowed.', Status.UNAUTHORIZED);
    }

    const qres = await query(`
        SELECT COUNT(*) as count
            FROM user
    `);

    if (!qres.length) {
        return res.error('Couldn\' find any values', Status.INTERNAL_SERVER_ERROR);
    }

    return res.respond({
        total_users_count: qres[0].count
    });
};
