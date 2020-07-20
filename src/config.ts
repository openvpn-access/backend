import deepmerge from 'deepmerge';
import defaultConfig from '../config/default.json';
import developmentConfig from '../config/development.json';
import productionConfig from '../config/production.json';
import testConfig from '../config/test.json';

type Config = {
    server: {
        port: number;
        host: string;
        apiEndpoint: string;
    };

    db: {
        url: string;
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
        logLevels: Array<string>;
    };
}

const env = process.env.NODE_ENV;
const sourceConfig = env === 'production' ? productionConfig :
    env === 'development' ? developmentConfig :
        testConfig;

export const config = deepmerge<Config>(
    defaultConfig,
    sourceConfig,
    {
        arrayMerge(destinationArray, sourceArray) {
            return sourceArray;
        }
    }
);

// Inject prisma env-variable
// TODO: Update if status of https://github.com/prisma/prisma/issues/3038 changes
process.env.DATABASE_URL = config.db.url;
