import {Server} from 'hapi';
import {config} from '../config';
import {login} from './Login';
import {patchUser} from './PatchUser';

/**
 * This function takes care of registering all the important,
 * api-related endpoints.
 * @param server
 */
export const launchAPI = async (server: Server): Promise<unknown> => {
    return server.register({
        name: 'api-wrapper',
        register(server) {

            // Register api endpoints
            login(server);
            patchUser(server);
        }
    }, {
        routes: {
            prefix: config.server.apiEndpoint
        }
    });
};
