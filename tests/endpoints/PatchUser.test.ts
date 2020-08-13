import 'jest-extended';
import request from 'supertest';
import {app} from '../../src';
import {Status} from '../../src/api/enums/Status';
import {db} from '../../src/db';

let token: string | null = null;

beforeAll(async () => {

    // Login using the admin account
    await request(app)
        .post('/api/v1/login')
        .send({login_id: 'admin', password: 'password'})
        .expect(Status.OK)
        .then(res => token = res.body.token);
});

afterAll(async () => {

    // Clean up dangling users
    await db.user.deleteMany({
        where: {username: {in: ['mori.noma']}}
    });

    db.$disconnect();
});

describe('PATCH /api/users', () => {
    it('Should change the username, email, type and state of an user', async () => {

        // Add new user
        const user = await db.user.create({
            data: {
                username: 'mori.maier',
                email: 'mori@maier.ada',
                type: 'user',
                password: 'weo'
            }
        });

        return request(app)
            .patch(`/api/v1/users/${user.id}`)
            .set('Authorization', `Baerer ${token}`)
            .send({
                'username': 'mori.noma',
                'email': 'noa@muxa.com',
                'type': 'admin'
            })
            .expect(Status.OK)
            .expect(res => {
                expect(res.body.username).toEqual('mori.noma');
                expect(res.body.email).toEqual('noa@muxa.com');
                expect(res.body.type).toEqual('admin');
            });
    });
});
