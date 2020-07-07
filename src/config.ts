import deepmerge from 'deepmerge';
import defaultConfig from '../config/default.json';
import developmentConfig from '../config/development.json';
import productionConfig from '../config/production.json';
import {LogLevel} from './logging';

type Config = {
    server: {
        port: number;
        host: string;
        apiEndpoint: string;
    };

    db: {
        host: string;
        user: string;
        password: string;
        database: string;
    };

    security: {
        saltRounds: number;
        apiKeySize: number;
    };

    logs: {
        logUserAgent: boolean;
        logLevels: Array<LogLevel>;
    };
}

export const config = deepmerge(
    defaultConfig,
    process.env.NODE_ENV === 'development' ?
        (developmentConfig as Config) :
        (productionConfig as Config),
    {
        arrayMerge(destinationArray, sourceArray) {
            return sourceArray;
        }
    }
) as Config;
