import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {ErrorCode} from '../../src/api/enums/ErrorCode';
import {Status} from '../../src/api/enums/Status';
import {config} from '../../src/config';
import {db} from '../../src/db';
import {errorCode} from '../utils/error';

// Reset login attempts from admin
const resetLoginAttempts = async () => await db.web_login_attempt.deleteMany({
    where: {
        state: 'fail',
        login_id: 'admin'
    }
});

// Reset login attempts before and after all tests
beforeAll(resetLoginAttempts);
afterAll(resetLoginAttempts);

describe('POST /api/login', () => {
    it('Should return an error if the payload is invalid', async () => {
        return request(app)
            .post('/api/v1/login')
            .send({})
            .expect(Status.BAD_REQUEST)
            .expect(errorCode(ErrorCode.INVALID_PAYLOAD));
    });

    it('Should login the administrator using username and password', async () => {
        return request(app)
            .post('/api/v1/login')
            .send({login_id: 'admin', password: 'password'})
            .expect(Status.OK)
            .then(res => {
                expect(res.body.token).toBeString();
                expect(res.body.user).toBeObject();
            });
    });

    it('Should login the administrator using username and email', async () => {
        return request(app)
            .post('/api/v1/login')
            .send({login_id: 'admin@vpnaccess.com', password: 'password'})
            .expect(Status.OK)
            .then(res => {
                expect(res.body.token).toBeString();
                expect(res.body.user).toBeObject();
            });
    });

    it('Should respond properly if the user does not exist', async () => {
        return request(app)
            .post('/api/v1/login')
            .send({login_id: 'hello', password: 'password'})
            .expect(Status.NOT_FOUND)
            .expect(errorCode(ErrorCode.USER_NOT_FOUND));
    });

    it('Should respond properly if the password is invalid', async () => {
        return request(app)
            .post('/api/v1/login')
            .send({login_id: 'admin', password: 'admin'})
            .expect(Status.UNAUTHORIZED)
            .expect(errorCode(ErrorCode.INVALID_PASSWORD));
    });

    const {loginAttempts} = config.security;
    it(`Should lock the account after ${loginAttempts} failed login attempts (${loginAttempts - 1} left)`, async () => {
        for (let i = 0; i < loginAttempts - 1; i++) {
            await request(app)
                .post('/api/v1/login')
                .send({login_id: 'admin', password: 'admin'})
                .expect(Status.UNAUTHORIZED)
                .expect(errorCode(ErrorCode.INVALID_PASSWORD));
        }

        await request(app)
            .post('/api/v1/login')
            .send({login_id: 'admin', password: 'admin'})
            .expect(Status.LOCKED)
            .expect(errorCode(ErrorCode.LOCKED_ACCOUNT));
    });
});
