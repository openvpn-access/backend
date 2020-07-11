import 'jest-extended';
import request from 'supertest';
import {app} from '../src';
import {ErrorCode} from '../src/api/enums/ErrorCode';
import {Status} from '../src/api/enums/Status';
import {errorCode} from './utils/error';

describe('POST /api/login', () => {
    it('Should return an error if the payload is invalid', async () => {
        return request(app)
            .post('/api/login')
            .send({})
            .expect(Status.UNPROCESSABLE_ENTITY)
            .expect(errorCode(ErrorCode.INVALID_PAYLOAD));
    });

    it('Should login the administrator using the default credentials', async () => {
        return request(app)
            .post('/api/login')
            .send({id: 'admin', password: 'password'})
            .expect(Status.OK)
            .then(res => {
                expect(res.body.token).toBeString();
                expect(res.body.user).toBeObject();
            });
    });

    it('Should respond properly if the user does not exist', async () => {
        return request(app)
            .post('/api/login')
            .send({id: 'hello', password: 'password'})
            .expect(Status.NOT_FOUND)
            .expect(errorCode(ErrorCode.USER_NOT_FOUND));
    });

    it('Should respond properly if the password is invalid', async () => {
        return request(app)
            .post('/api/login')
            .send({id: 'admin', password: 'admin'})
            .expect(Status.UNAUTHORIZED)
            .expect(errorCode(ErrorCode.INVALID_PASSWORD));
    });
});
