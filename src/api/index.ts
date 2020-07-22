import {Router} from 'express';
import {deleteUser} from './endpoints/DeleteUser';
import {getLoginAttemptWeb} from './endpoints/GetLoginAttemptWeb';
import {getUser} from './endpoints/GetUser';
import {getUserStats} from './endpoints/GetUserStats';
import {patchUser} from './endpoints/PatchUser';
import {postLogin} from './endpoints/PostLogin';
import {postLogout} from './endpoints/PostLogout';
import {postUserEmailVerify} from './endpoints/PostUserEmailVerify';
import {postUserEmailVerifySend} from './endpoints/PostUserEmailVerifySend';
import {putUser} from './endpoints/PutUser';
import {auth} from './middleware/auth';

/**
 * Returns a router will all api-related endpoints bound to it.
 */
export const api = (): Router => {
    const router = Router();

    // Register routes
    router.post('/login', postLogin);
    router.post('/logout', auth, postLogout);
    router.get('/users', auth, getUser);
    router.put('/users', auth, putUser);
    router.get('/users/stats', auth, getUserStats);
    router.patch('/users/:id', auth, patchUser);
    router.delete('/users/:id', auth, deleteUser);
    router.post('/users/email/verify', postUserEmailVerify);
    router.post('/users/email/verify/send', postUserEmailVerifySend);
    router.get('/login-attempts/web', auth, getLoginAttemptWeb);

    return router;
};
