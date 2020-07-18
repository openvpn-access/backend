/* eslint-disable camelcase */
type DBEntry = {id: number};

export type DBUser = DBEntry & {
    created_at: Date;
    updated_at: Date;
    type: 'admin' | 'user';
    state: 'activated' | 'pending' | 'deactivated';
    email: string;
    email_verified: boolean;
    username: string;
    password: string;
    transfer_limit_period: number;
    transfer_limit_start: Date;
    transfer_limit_end: Date;
    transfer_limit_bytes: number;
};
