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

    email: {
        from: string;
        transport: {
            host: string;
            port: number;
            auth: {
                user: string;
                pass: string;
            };
        };
    };

    db: {
        url: string;
        exposed: {
            user: Record<string, boolean>;
            web_login_attempt: Record<string, boolean>;
        };
    };

    security: {
        saltRounds: number;
        tokenSize: number;
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
