import {Server} from 'hapi';
import Boom from '@hapi/boom';
import {query} from './db';

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
                    return Boom.unauthorized('Missing baerer token');
                }

                const [, token] = match;
                const res = await query(`
                    SELECT u.*
                        FROM user u, user_session us
                        WHERE us.token = (?)
                        LIMIT 1
                `, [token]);

                if (!res.length) {
                    return Boom.unauthorized('Invalid baerer token');
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
