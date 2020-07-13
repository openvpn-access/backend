/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mariadb, {QueryOptions} from 'mariadb';
import {config} from '../config';
import {log, LogLevel} from '../logging';

export const pool = mariadb.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

export const db = pool.getConnection()
    .then(pool => {
        log('database-connected', {}, LogLevel.INFO);
        return pool;
    })
    .catch(err => {
        log('database-failure', {
            reason: err.toString()
        }, LogLevel.FATAL);
        process.exit(-5);
    });

export interface DBError extends Error {
    fatal: boolean;
    errno: number;
    sqlState: string;
    code: string;
}

export type QueryResult = [DBError | null, any];

export const query = async (sql: string | QueryOptions, values?: Array<unknown> | Record<string, unknown> | unknown): Promise<QueryResult> => {
    let promise;

    // Named values
    if (typeof sql === 'string' &&
        typeof values === 'object' &&
        values !== null &&
        !Array.isArray(values)) {
        promise = (await db).query({
            namedPlaceholders: true,
            sql
        }, values);
    } else {
        promise = (await db).query(sql, values);
    }

    return promise.then(res => [null, res] as QueryResult)
        .catch(err => [err, null] as QueryResult);
};
