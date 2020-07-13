import express from 'express';
import {ValidationError} from '@hapi/joi';
import {Status} from '../api/enums/Status';

export type APIError = {
    status: number;
    code: number;
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
         * Response with empty body.
         * @param status, default is 204
         */
        respond(status?: Status): void;

        /**
         * Responds with an arror
         * @param m Either a string or a validation error
         * @param s Status message, default is BAD_REQUEST
         * @param c Optional error code
         */
        error(m: string | ValidationError, s: Status, c: number)
    }
}

express.response.respond = function(body: any, status = Status.OK) {
    switch (typeof body) {
        case 'number': {
            status = body;
            body = '';
            break;
        }
        case 'undefined': {
            body = '';
            status = Status.NO_CONTENT;
        }
    }

    this.status(status);
    this.send(body);
};

express.response.error = function(message, status, code) {
    this.status(status);
    this.send({
        status, code,
        message: typeof message === 'string' ? message : message.message
    } as APIError);
};
