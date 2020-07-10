import {Boom} from '@hapi/boom';
import {STATUS} from './status';

export type APIError = {
    statusCode: number;
    message: string;
    error: string;
    id: number;
    field?: string;
};

export const createError = (message: string, statusCode: STATUS, errorId: number, field?: string): Boom => {
    const boom = new Boom(message, {statusCode});
    const pl = boom.output.payload as APIError;

    // Attach custom error id
    pl.id = errorId;

    if (typeof field !== 'undefined') {
        pl.field = field;
    }

    return boom;
};
