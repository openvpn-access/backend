import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {api} from './api';
import {config} from './config';
import {db} from './db';
import {log, LogLevel} from './logging';

// Used in tests
export const app = express();

(async () => {
    const env = process.env.NODE_ENV;

    // Disable powered-by-message
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.use(bodyParser.json());

    if (env === 'development') {

        // Enable cors during development
        app.use(cors());
    }

    // Register api
    app.use('/api/v1', api());

    // Connect to database immediately
    await db.$connect();
    log('booting', {message: 'Connected to database'}, LogLevel.INFO);

    if (env !== 'test') {
        log('booting', {
            message: `Starting app in ${env}`
        }, LogLevel.INFO);

        app.listen(config.server.port);
        log('booting', {
            message: 'Server successfully started launched.'
        }, LogLevel.INFO);
    }
})();
