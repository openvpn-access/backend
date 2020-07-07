/* eslint-disable @typescript-eslint/ban-types */
type Error = {reason: string};

/* ===== SYSTEM EVENTS ===== */
export type BootEvent = {message: string};
export type ProcessExit = Error & {cause: string};

/* ===== DB EVENTS ===== */
export type DatabaseConnected = {};
export type DatabaseFailure = Error;

export type Events = {
    'booting': BootEvent;
    'process-exit': ProcessExit;
    'database-connected': DatabaseConnected;
    'database-failure': DatabaseFailure;
}
