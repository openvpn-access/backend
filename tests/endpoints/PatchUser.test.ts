import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {Status} from '../../src/api/enums/Status';
import {query} from '../../src/db';

let token: string | null = null;

beforeAll(async () => {

    // Login using the admin account
    await request(app)
        .post('/api/login')
        .send({id: 'admin', password: 'password'})
        .expect(Status.OK)
        .then(res => token = res.body.token);

    // Add new user
    await query(`
        INSERT INTO user (
            username, email, type, password
        ) VALUES ('mori.maier', 'mori@maier.ada', 'user', 'weo')
    `);
});

afterAll(async () => {

    // Clean up user
    await query(`
        INSERT INTO user (
            username, email, type, password
        ) VALUES ('mori.maier', 'mori@maier.ada', 'user', 'weo')
    `);
});

describe('PATCH /api/users', () => {
    it('Should change the username, email, type and state of an user', async () => {
        return request(app)
            .patch('/api/users/mori.maier')
            .set('Authorization', `Baerer ${token}`)
            .send({
                'username': 'mori.noma',
                'email': 'noa@muxa.se',
                'type': 'admin',
                'state': 'deactivated'
            })
            .expect(Status.OK)
            .expect(res => {
                expect(res.body.username).toEqual('mori.noma');
                expect(res.body.email).toEqual('noa@muxa.se');
                expect(res.body.type).toEqual('admin');
                expect(res.body.state).toEqual('deactivated');
            });
    });
});
