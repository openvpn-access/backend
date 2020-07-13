import {Request, Response} from 'express';
import {query} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const caller = req.session.user;
    const {user} = req.params;

    // Only admins can delete users
    if (caller.username !== 'admin') {
        return res.error('Only administrators can delete users.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
    }

    // The root 'admin' cannot be deleted
    if (user === 'admin') {
        return res.error('The user \'admin\' cannot be deleted.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
    }

    // Check if username or email is already in use
    // TODO: 'ON DELETE CASCADE' ??
    const [qerr, qres] = await query(`
        DELETE FROM user
            WHERE username = ?;
    `, [user]);

    if (qerr) {
        res.sendStatus(500);
    } else if (!qres.affectedRows) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    res.sendStatus(200);
};
