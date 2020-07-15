import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {ErrorCode} from '../../src/api/enums/ErrorCode';
import {Status} from '../../src/api/enums/Status';
import {query} from '../../src/db';
import {errorCode} from '../utils/error';

let token: string | null = null;

beforeAll(async () => {

    // Login using the admin account
    await request(app)
        .post('/api/login')
        .send({id: 'admin', password: 'password'})
        .expect(Status.OK)
        .then(res => token = res.body.token);
});

afterAll(async ()=>{

    // Clean up added users
    await query(`
        DELETE FROM user
            WHERE username = 'foobar';
    `);
});

describe('PUT /api/users', () => {
    it('Should add a new user', async () => {
        return request(app)
            .put('/api/users')
            .set('Authorization', `Baerer ${token}`)
            .send({
                'username': 'foobar',
                'email': 'foo@bar.baz',
                'type': 'user',
                'password': 'foobazbam'
            })
            .expect(Status.OK);
    });

    it('Should return a conflict if the username is already in use', async () => {
        return request(app)
            .put('/api/users')
            .set('Authorization', `Baerer ${token}`)
            .send({
                'username': 'foobar',
                'email': 'foo@bdaar.baz',
                'type': 'user',
                'password': 'foobazbam'
            })
            .expect(Status.CONFLICT)
            .expect(errorCode(ErrorCode.DUPLICATE_USERNAME));
    });

    it('Should return a conflict if the email is already in use', async () => {
        return request(app)
            .put('/api/users')
            .set('Authorization', `Baerer ${token}`)
            .send({
                'username': 'foobasr',
                'email': 'foo@bar.baz',
                'type': 'user',
                'password': 'foobazbam'
            })
            .expect(Status.CONFLICT)
            .expect(errorCode(ErrorCode.DUPLICATE_EMAIL));
    });
});
