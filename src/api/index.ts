import {Router} from 'express';
import {deleteUser} from './endpoints/DeleteUser';
import {getLoginAttemptWeb} from './endpoints/GetLoginAttemptWeb';
import {getUser} from './endpoints/GetUser';
import {getUserStats} from './endpoints/GetUserStats';
import {patchUser} from './endpoints/PatchUser';
import {patchUserMFA} from './endpoints/PatchUserMFA';
import {patchUserPasswordReset} from './endpoints/PatchUserPasswordReset';
import {postLogin} from './endpoints/PostLogin';
import {postLogout} from './endpoints/PostLogout';
import {postUserEmailVerify} from './endpoints/PostUserEmailVerify';
import {postUserEmailVerifySend} from './endpoints/PostUserEmailVerifySend';
import {postUserMFA} from './endpoints/PostUserMFA';
import {postUserMFAGenerate} from './endpoints/PostUserMFAGenerate';
import {postUserPasswordResetSend} from './endpoints/PostUserPasswordResetSend';
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
    router.patch('/users/:id', auth, patchUser); // TODO: Rename :id to :user_id
    router.delete('/users/:id', auth, deleteUser);
    router.patch('/users/:id/mfa', patchUserMFA);
    router.post('/users/mfa', postUserMFA);
    router.post('/users/:id/mfa/generate', auth, postUserMFAGenerate);
    router.post('/users/email/verify', postUserEmailVerify);
    router.post('/users/email/verify/send', postUserEmailVerifySend);
    router.post('/users/password/reset', patchUserPasswordReset);
    router.post('/users/password/reset/send', postUserPasswordResetSend);
    router.get('/login-attempts/web', auth, getLoginAttemptWeb);

    return router;
};
