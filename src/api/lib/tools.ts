/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Response} from 'express';
import {ErrorCode} from '../enums/ErrorCode';
import {Status} from '../enums/Status';

export type APIResponse = {
    kind: 'response';
    body: any;
    status: Status;
};

export type APIError = {
    kind: 'error';
    body: string;
    status: Status;
    code: number;
};

export const responseTools = {
    respond(body?: any, status = Status.OK): APIResponse {
        return {
            kind: 'response',
            body, status
        };
    },

    error(message: string, status: Status, code: number): APIError {
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

export const respondWith = (res: Response, answer: APIResponse | APIError): void => {
    const {status, body} = answer;
    switch (answer.kind) {
        case 'response': {
            res.status(status);
            res.send(body);
            break;
        }
        case 'error': {
            res.status(status);
            res.send({
                status: answer.status,
                code: answer.code,
                message: body
            });
            break;
        }
        default: {

            // We should never get here
            res.sendStatus(500);
        }
    }
};
