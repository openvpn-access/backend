import {hash} from 'bcrypt';
import Joi from 'joi';
import {config} from '../../config';
import {db} from '../../db';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {createEndpoint} from '../lib/endpoint';

export const patchUserPasswordReset = createEndpoint({
    method: 'PATCH',
    route: '/users/password/reset',

    validation: {
        body: Joi.object({
            new_password: Joi.string()
                .min(8)
                .max(50)
                .regex(/^[^\s]+$/),

            token: Joi.string()
        })
    },

    async handle(req, res) {
        const {body} = req;

        // Validate token
        const token = await db.user_access_token.findOne({
            where: {token: body.token}
        });

        // TODO: Manually checking the type might not be the best solution?!
        if (!token || token.type !== 'reset_password') {
            return res.error('Invalid password reset token', Status.UNAUTHORIZED, ErrorCode.INVALID_TOKEN);
        }

        // Update password
        const user = await db.user.update({
            data: {password: await hash(body.new_password, config.security.saltRounds)},
            where: {id: token.user_id}
        });

        // Remove all password-reset related tokens for this user
        await db.user_access_token.deleteMany({
            where: {
                user_id: token.user_id,
                type: 'reset_password'
            }
        });

        // Invalidate all sessions
        await db.web_session.deleteMany({
            where: {user_id: user.id}
        });

        return res.respond();
    }
});
