/* eslint-disable @typescript-eslint/ban-types */
type Error = {reason: string};

/* ===== SYSTEM EVENTS ===== */
export type BootEvent = {message: string};
export type ProcessExit = Error & {cause: string};

export type Events = {
    'booting': BootEvent;
    'process-exit': ProcessExit;
}
