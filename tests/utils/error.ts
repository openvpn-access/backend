import request from 'supertest';
import {ErrorCode} from '../../src/api/enums/ErrorCode';

export const errorCode = (code: ErrorCode) => (res: request.Response): void | never => {
    expect(res.body.code).toEqual(code);
};
