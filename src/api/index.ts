import {Server} from 'hapi';
import {config} from '../config';
import {login} from './Login';

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
        }
    }, {
        routes: {
            prefix: config.server.apiEndpoint
        }
    });
};
