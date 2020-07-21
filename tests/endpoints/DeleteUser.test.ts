import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {Status} from '../../src/api/enums/Status';
import {db} from '../../src/db';

let token: string | null = null;

beforeAll(async () => {

    // Login using the admin account
    await request(app)
        .post('/api/login')
        .send({id: 'admin', password: 'password'})
        .expect(Status.OK)
        .then(res => token = res.body.token);
});

describe('DELETE /api/users', () => {
    it('Should remove a user', async () => {

        // Add new user
        const user = await db.user.create({
            data: {
                username: 'deleteme',
                email: 'delete@me.baz',
                type: 'user',
                password: 'hi'
            }
        });

        return request(app)
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Baerer ${token}`)
            .expect(Status.OK);
    });
});
