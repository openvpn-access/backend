import Hapi from '@hapi/hapi';
import {launchAPI} from './api';
import {config} from './config';
import {log, LogLevel} from './logging';

(async () => {
    const server = Hapi.server({
        port: config.server.port,
        host: config.server.host
    });

    await launchAPI(server);
    log('booting', {
        message: 'API Registered'
    }, LogLevel.INFO);

    await server.start();
    log('booting', {
        message: `Starting app in ${process.env.NODE_ENV} mode`
    }, LogLevel.INFO);
})();

