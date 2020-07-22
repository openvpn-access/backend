import {db} from '../../db';
import {endpoint} from '../framework';

export const postLogout = endpoint(async (req, res) => {

    // Remove session
    await db.web_session.delete({
        where: {
            token: req.session.token
        }
    });

    return res.respond();
});
