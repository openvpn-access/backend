import {api} from './api';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import {config} from './config';
import {log, LogLevel} from './logging';
import './extenstions/respond';

const env = process.env.NODE_ENV;
export const app = express();

// Disable powered-by-message
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(bodyParser.json());

// Register api
app.use('/api', api());

// TODO: Refactor this, that looks ugly
if (env !== 'test') {
    if (env === 'development') {
        log('booting', {
            message: 'Starting app in development'
        }, LogLevel.INFO);

        // Enable cors during development
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
}
