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

if (env === 'development') {

    // Enable cors during development
    app.use(cors());
}

// Register api
app.use('/api', api());

// TODO: Refactor this, that looks ugly
if (env !== 'test') {
    log('booting', {
        message: `Starting app in ${env}`
    }, LogLevel.INFO);

    app.listen(config.server.port);
    log('booting', {
        message: 'Server successfully started launched.'
    }, LogLevel.INFO);
}
