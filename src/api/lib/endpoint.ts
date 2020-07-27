/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextFunction, Request, Response, Router} from 'express';
import {AnySchema} from 'joi';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';
import {APIError, APIResponse, respondWith, responseTools} from './tools';

export type AnyRequestPayload = {params: any; query: any; body: any;};
export type Endpoint = (req: AnyRequestPayload & Request, tools: ResponseTools) => Promise<APIResponse | APIError>;
export type ResponseTools = typeof responseTools;
export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export type EndpointConfig = {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
    route: string;
    middleware?: Array<ExpressMiddleware> | ExpressMiddleware;

    validation?: {
        params?: AnySchema;
        query?: AnySchema;
        body?: AnySchema;
    };

    handle: Endpoint;
};

const logErrors = ['test', 'development'].includes(process.env.NODE_ENV);
export const createEndpoint = (cfg: EndpointConfig): ((res: Router) => void) => {

    // Pre-process validation properties
    const validations = !cfg.validation ? [] :
        Object.entries(cfg.validation).filter(v => v[1]) as Array<[string, AnySchema]>;

    // Pre-process array of middlewares
    const middlewares = !cfg.middleware ? [] :
        Array.isArray(cfg.middleware) ? cfg.middleware : [cfg.middleware];

    return (res: Router): void => {
        const method = cfg.method.toLocaleLowerCase();

        res[method](
            cfg.route, ...middlewares,
            (req, res) => {

                // Validate payload
                for (const [key, validator] of validations) {
                    const {error, value} = validator.validate(req[key]);
                    if (error) {
                        return respondWith(res, responseTools.error(
                            error.message,
                            Status.BAD_REQUEST,
                            ErrorCode.INVALID_PAYLOAD
                        ));
                    }

                    // Override with parsed value
                    req[key] = value;
                }

                cfg.handle(req, responseTools).catch(err => {

                    /* eslint-disable no-console */
                    if (logErrors) {
                        console.error(err);
                    }

                    return responseTools.internalError();
                }).then(data => respondWith(res, data));
            }
        );
    };
};
