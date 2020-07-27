/* eslint-disable @typescript-eslint/ban-types */
type Error = {reason: string};

/* ===== SYSTEM EVENTS ===== */
export type BootEvent = {message: string};
export type ProcessExit = Error & {cause: string};

/* ===== API EVENTS ===== */
export type APIEndpointRegister = {method: string; route: string; middlewares: number;}
export type APIInternalError = Error;

export type Events = {
    'booting': BootEvent;
    'process-exit': ProcessExit;
    'api-setup-endpoint': APIEndpointRegister;
    'api-endpoint-error': APIInternalError;
    'api-middleware-error': APIInternalError;
}
