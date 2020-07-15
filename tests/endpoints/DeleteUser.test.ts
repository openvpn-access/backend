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
        ) VALUES ('deleteme', 'delete@me.baz', 'user', 'hi')
    `);
});

describe('DELETE /api/users', () => {
    it('Should remove a user', async () => {
        return request(app)
            .delete('/api/users/deleteme')
            .set('Authorization', `Baerer ${token}`)
            .expect(Status.NO_CONTENT);
    });
});
