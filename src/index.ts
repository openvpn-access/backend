import Hapi from '@hapi/hapi';
import {config} from './config';
import {log, LogLevel} from './logging';

(async () => {
    const server = Hapi.server({
        port: config.server.port,
        host: 'localhost'
    });

    await server.start();
    log('booting', {
        message: `Starting app in ${process.env.NODE_ENV} mode`
    }, LogLevel.INFO);
})();

