import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {Status} from '../../src/api/enums/Status';

let token: string | null = null;

beforeAll(async () => {

    // Login using the admin account
    await request(app)
        .post('/api/login')
        .send({id: 'admin', password: 'password'})
        .expect(Status.OK)
        .then(res => token = res.body.token);
});

describe('GET /api/users/stats', () => {
    it('Should return the amount of users', async () => {
        return request(app)
            .get('/api/users/stats')
            .set('Authorization', `Baerer ${token}`)
            .expect(Status.OK)
            .expect(res => {
                expect(res.body.total_users_count).toBeNumber();
            });
    });
});
