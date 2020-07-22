/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextFunction, Request, Response} from 'express';
import {ValidationError} from 'joi';
import {ErrorCode} from './enums/ErrorCode';
import {Status} from './enums/Status';

export type APIResponse = {
    kind: 'response';
    body: any;
    status: Status;
};

export type APIError = {
    kind: 'error';
    body: ValidationError | string;
    status: Status;
    code: number;
};

const logErrors = ['test', 'development'].includes(process.env.NODE_ENV);
const resTools = {
    respond(body?: any, status = Status.OK): APIResponse {
        return {
            kind: 'response',
            body, status
        };
    },

    error(message: ValidationError | string, status: Status, code: number): APIError {
        return {
            kind: 'error',
            body: message,
            status, code
        };
    },

    internalError(): APIError {
        return {
            kind: 'error',
            body: 'Internal server error',
            status: Status.INTERNAL_SERVER_ERROR,
            code: ErrorCode.INTERNAL_ERROR
        };
    }
};

type ResponseTools = typeof resTools;
export type Endpoint = (req: Request, tools: ResponseTools) => Promise<APIResponse | APIError>;
export type Middleware = (req: Request, tools: Omit<ResponseTools, 'respond'>) => Promise<void | APIError>;

/**
 * Creates an single enpoints.
 * Returns a function which can be passed to express as last function.
 * @param endpoint Implementation
 */
export const endpoint = (endpoint: Endpoint) => async (req: Request, res: Response): Promise<void> => {
    const data = await endpoint(req, resTools).catch(err => {

        /* eslint-disable no-console */
        if (logErrors) {
            console.error(err);
        }

        return resTools.internalError();
    });

    const {status, body} = data;
    switch (data.kind) {
        case 'response': {
            res.status(status);
            res.send(body);
            break;
        }
        case 'error': {
            res.status(status);
            res.send({
                status: data.status,
                code: data.code,
                message: typeof body === 'string' ? body : body.message
            });
            break;
        }
        default: {

            // We should never get here
            res.sendStatus(500);
        }
    }
};

/**
 * Creates a middleware.
 * Returns a function which can be passed to express as a middleware-function.
 * @param middleware
 */
export const middleware = (middleware: Middleware) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = await middleware(req, resTools).catch(err => {

        /* eslint-disable no-console */
        if (logErrors) {
            console.error(err);
        }

        return resTools.internalError();
    });

    if (data) {
        const {status, body, code} = data;
        res.status(status);
        res.send({
            status, code,
            message: typeof body === 'string' ? body : body.message
        });
    } else {
        next();
    }
};
