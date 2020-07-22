/* eslint-disable */
declare var process: NodeJS.Process & {
    env: {
        NODE_ENV: 'development' | 'production' | 'test'
    }
};
