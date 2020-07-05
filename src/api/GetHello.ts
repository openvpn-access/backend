import {Server} from 'hapi';

export const getHello = (server: Server): void => {
    server.route({
        method: 'GET',
        path: '/hello',
        handler(): string {
            return 'Hello World';
        }
    });
};
