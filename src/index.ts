import {api} from './api';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import {config} from './config';
import {log, LogLevel} from './logging';
import './extenstions/respond';

(async () => {
    const dev = process.env.NODE_ENV === 'development';
    const app = express();

    // Disable powered-by-message
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.use(bodyParser.json());

    // Register api
    app.use('/api', api());

    // Enable cors during development
    if (dev) {
        log('booting', {
            message: 'Starting app in development'
        }, LogLevel.INFO);

        app.use(cors());
    } else {
        log('booting', {
            message: 'Starting app in production'
        }, LogLevel.INFO);
    }

    app.listen(config.server.port);
    log('booting', {
        message: 'Server successfully started launched.'
    }, LogLevel.INFO);
})();

