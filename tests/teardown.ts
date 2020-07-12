import {pool} from '../src/db';

export default async (): Promise<void> => {

    // Close db pool
    await pool.end();
};
