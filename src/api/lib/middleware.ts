import {NextFunction, Request, Response} from 'express';
import {ResponseTools} from './endpoint';
import {APIError, respondWith, responseTools} from './tools';

export type Middleware = (req: Request, tools: Omit<ResponseTools, 'respond'>) => Promise<void | APIError>;
const logErrors = ['test', 'development'].includes(process.env.NODE_ENV);

/**
 * Creates a middleware.
 * Returns a function which can be passed to express as a middleware-function.
 * @param middleware
 */
export const createMiddleware = (middleware: Middleware) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = await middleware(req, responseTools).catch(err => {

        /* eslint-disable no-console */
        if (logErrors) {
            console.error(err);
        }

        return responseTools.internalError();
    });

    if (data) {
        respondWith(res, data);
    } else {
        next();
    }
};
