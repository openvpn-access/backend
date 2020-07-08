import {Boom} from '@hapi/boom';

export type APIError = {
    statusCode: number;
    message: string;
    error: string;
    id: number;
};

export const createError = (message: string, statusCode: number, errorId: number): Boom => {
    const boom = new Boom(message, {statusCode});

    // Attach custom error id
    (boom.output.payload as APIError).id = errorId;
    return boom;
};
