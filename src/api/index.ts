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

/**
 * Returns a router will all api-related endpoints bound to it.
 */
export const api = (): Router => {
    const router = Router();

    // Register routes
    const routes = [

        // Login / logout
        postLogin, postLogout,

        // Users
        getUser, putUser, getUserStats,
        patchUser, deleteUser,

        // 2FA Authentication
        patchUserMFA, postUserMFA,
        postUserMFAGenerate,

        // Email
        postUserEmailVerify,
        postUserEmailVerifySend,

        // Password
        patchUserPasswordReset,
        postUserPasswordResetSend,

        // Tables
        getLoginAttemptWeb
    ];

    for (const route of routes) {
        route(router);
    }

    return router;
};
