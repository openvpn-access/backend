import {db} from '../../db';
import {bearer} from '../auth/bearer';
import {createEndpoint} from '../lib/endpoint';

export const postLogout = createEndpoint({
    method: 'POST',
    route: '/logout',
    middleware: bearer,

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
