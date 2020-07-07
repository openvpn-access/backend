/* eslint-disable camelcase */
type DBEntry = {id: string};

export type DBUser = DBEntry & {
    created_at: Date;
    updated_at: Date;
    type: 'admin' | 'user';
    state: 'activated' | 'pending' | 'deactivated';
    email: string;
    username: string;
    password: string;
};

export type DBLoginAttemptWeb = DBEntry & {
    user_id: string;
    created_at: Date;
    state: 'pass' | 'fail';
    username: string;
    ip_addr: string;
};

export type DBLoginAttemptVPN = DBEntry & {
    user_id: string;
    created_at: Date;
    state: 'empty_cred' | 'bad_password' | 'eof' | 'no_user' | 'pass';
    username: string;
    ip_addr: string;
};

export type DBUserSession = DBEntry & {
    user_id: string;
    created_at: Date;
    token: string;
};

export type DBVPNSession = DBEntry & {
    user_id: string;
    created_at: Date;
    closed_at: Date;
    transferred: number;
};
