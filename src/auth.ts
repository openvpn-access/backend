import {Server} from 'hapi';
import {query} from './db';
import {createError} from './utils/error';
import {STATUS} from './utils/status';

const BAERER_REGEX = /Bearer +(.+?)( +|$)/;
export const implementBearerScheme = (server: Server): void => {

    // Create scheme
    server.auth.scheme('baerer', () => {
        return {
            async authenticate(request, h) {
                const req = request.raw.req;
                const authorization = req.headers.authorization || '';
                const match = BAERER_REGEX.exec(authorization);

                if (!match) {
                    return createError('Missing baerer token', STATUS.BAD_REQUEST, 1);
                }

                const [, token] = match;
                const res = await query(`
                    SELECT u.*
                        FROM user u, user_session us
                        WHERE us.token = (?)
                        LIMIT 1
                `, [token]);

                if (!res.length) {
                    return createError('Invalid baerer token', STATUS.UNAUTHORIZED, 2);
                }

                return h.authenticated({
                    credentials: {user: res[0]}
                });
            }
        };
    });

    // Add and set as default
    server.auth.strategy('baerer', 'baerer');
    server.auth.default('baerer');
};
