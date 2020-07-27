import {NextFunction, Request, Response} from 'express';
import {log, LogLevel} from '../../logging';
import {ResponseTools} from './endpoint';
import {APIError, respondWith, responseTools} from './tools';

export type Middleware = (req: Request, tools: Omit<ResponseTools, 'respond'>) => Promise<void | APIError>;

/**
 * Creates a middleware.
 * Returns a function which can be passed to express as a middleware-function.
 * @param middleware
 */
export const createMiddleware = (middleware: Middleware) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = await middleware(req, responseTools).catch(err => {
        log('api-middleware-error', {reason: err}, LogLevel.ERROR);
        return responseTools.internalError();
    });

    if (data) {
        respondWith(res, data);
    } else {
        next();
    }
};
