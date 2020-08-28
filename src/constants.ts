import {config} from './config';

const env = process.env.NODE_ENV;
const {server} = config;

// URL-Related constants
export const baseUrlProtocol = env === 'development' ? 'http' : 'https';
export const baseUrlHost = server.host + (server.port ? `:${server.port}` : '');
export const baseUrl = `${baseUrlProtocol}://${baseUrlHost}`;
