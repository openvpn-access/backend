import deepmerge from 'deepmerge';
import defaultConfig from '../config/default.json';
import developmentConfig from '../config/development.json';
import productionConfig from '../config/production.json';
import testConfig from '../config/test.json';
import {LogLevel} from './logging';

type Config = {
    server: {
        port: number;
        host: string;
        apiEndpoint: string;
    };

    db: {
        exposed: {
            user: Record<string, boolean>;
        };
    };

    security: {
        saltRounds: number;
        apiKeySize: number;
        loginAttempts: number;
        loginAttemptsTimeRange: number;
    };

    logs: {
        logUserAgent: boolean;
        logLevels: Array<LogLevel>;
    };
}

const env = process.env.NODE_ENV;
const sourceConfig = env === 'production' ? productionConfig :
    env === 'development' ? developmentConfig :
        testConfig;

export const config = deepmerge(
    defaultConfig, sourceConfig,
    {
        arrayMerge(destinationArray, sourceArray) {
            return sourceArray;
        }
    }
) as Config;
