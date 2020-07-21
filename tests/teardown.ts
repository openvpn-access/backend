import {db} from '../src/db';

export default async (): Promise<void> => {

    // TODO: This doesn't work - the're is a memory leak somewhere
    await db.disconnect();
};
