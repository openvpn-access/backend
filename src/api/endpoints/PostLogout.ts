import {db} from '../../db';
import {createEndpoint} from '../lib/endpoint';

export const postLogout = createEndpoint({
    method: 'POST',
    route: '/logout',

    async handle(req, res) {

        // Remove session
        await db.web_session.delete({
            where: {
                token: req.session.token
            }
        });

        return res.respond();
    }
});
