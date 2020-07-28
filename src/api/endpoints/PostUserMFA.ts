import Joi from 'joi';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const postUserMFA = createEndpoint({
    method: 'POST',
    route: '/users/mfa',

    validation: {
        body: Joi.object({
            login_id: Joi.string()
        })
    },

    async handle(req, res) {
        const {login_id} = req.body;

        const [user] = await db.user.findMany({
            where: {
                OR: [
                    {username: login_id},
                    {email: login_id}
                ]
            }
        });

        if (!user) {
            return res.error('User not found', Status.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
        }

        return res.respond({
            mfa_required: user.mfa_activated
        });
    }
});
