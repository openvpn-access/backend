import {Router} from 'express';
import {getUser} from './GetUser';
import {getUserStats} from './GetUserStats';
import {login} from './Login';
import {auth} from './middleware/auth';
import {patchUser} from './PatchUser';

/**
 * Returns a router will all api-related endpoints bound to it.
 */
export const api = (): Router => {
    const router = Router();

    // Register routes
    router.post('/login', login);
    router.get('/users', auth, getUser);
    router.get('/users/stats', auth, getUserStats);
    router.patch('/users/:user', auth, patchUser);

    return router;
};
