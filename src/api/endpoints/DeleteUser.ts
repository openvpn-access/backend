import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {endpoint} from '../framework';

export const deleteUser = endpoint(async (req, res) => {
    const caller = req.session.user;
    const {id} = req.params;

    // Only admins can delete users
    if (caller.username !== 'admin') {
        return res.error('Only administrators can delete users.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
    }

    // The root 'admin' cannot be deleted
    const toDelete = await db.user.findOne({where: {id: Number(id)}});
    if (!toDelete) {
        return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }

    if (toDelete.username === 'admin') {
        return res.error('The user \'admin\' cannot be deleted.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
    }

    // Delete user
    await db.user.delete({where: {id: toDelete.id}});
    return res.respond();
});
