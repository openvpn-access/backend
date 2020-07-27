import Joi from 'joi';
import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const deleteUser = createEndpoint({
    method: 'DELETE',
    route: '/users/:id',
    middleware: bearer,

    validation: {
        params: Joi.object({
            id: Joi.number()
        })
    },

    async handle(req, res) {
        const caller = req.session.user;
        const {id} = req.params;

        // Only admins can delete users
        if (caller.username !== 'admin') {
            return res.error('Only administrators can delete users.', Status.FORBIDDEN, ErrorCode.NOT_ADMIN);
        }

        // The root 'admin' cannot be deleted
        const toDelete = await db.user.findOne({where: {id}});
        if (!toDelete) {
            return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
        }

        if (toDelete.username === 'admin') {
            return res.error('The user \'admin\' cannot be deleted.', Status.FORBIDDEN, ErrorCode.LOCKED_USERNAME);
        }

        // Delete user
        await db.user.delete({where: {id: toDelete.id}});
        return res.respond();
    }
});
