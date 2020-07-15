import {Router} from 'express';
import {deleteUser} from './endpoints/DeleteUser';
import {getUser} from './endpoints/GetUser';
import {getUserStats} from './endpoints/GetUserStats';
import {login} from './endpoints/Login';
import {putUser} from './endpoints/PutUser';
import {auth} from './middleware/auth';
import {patchUser} from './endpoints/PatchUser';

/**
 * Returns a router will all api-related endpoints bound to it.
 */
export const api = (): Router => {
    const router = Router();

    // Register routes
    router.post('/login', login);
    router.get('/users', auth, getUser);
    router.put('/users', auth, putUser);
    router.get('/users/stats', auth, getUserStats);
    router.patch('/users/:user', auth, patchUser);
    router.delete('/users/:user', auth, deleteUser);

    return router;
};
