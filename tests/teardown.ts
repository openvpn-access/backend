import {pool} from '../src/db';

export default async (): Promise<void> => {
    await pool.end();
};
