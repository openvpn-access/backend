import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

export const deleteUser = endpoint(async (req, res) => {
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
    const deltedUser = await db.user.delete({
        where: {username: user}
    });

    if (!deltedUser) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    return res.respond();
});
