import express from 'express';
import {ValidationError} from '@hapi/joi';
import {Status} from '../utils/status';


export type APIError = {
    status: number;
    message: string;
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
declare module 'express-serve-static-core' {
    interface Response {

        /**
         * Response to the request
         * @param body Response body
         * @param status Status code, default is OK
         */
        respond(body: any, status?: Status): void;

        /**
         * Responds with an arror
         * @param m Either a string or a validation error
         * @param s Status message, default is BAD_REQUEST
         * @param c Optional error code
         */
        error(m: string | ValidationError, s?: Status, c?: number)
    }
}

express.response.respond = function(body, status) {
    this.status(status || Status.OK);
    this.send(body);
};

express.response.error = function(message, status = Status.BAD_REQUEST, code) {
    this.status(status);
    this.send({
        status,
        message: typeof message === 'string' ? message : message.message,
        ...(typeof code === 'number' && {code})
    } as APIError);
};
