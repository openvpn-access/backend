import {randomBytes} from 'crypto';
import {promisify} from 'util';
import {log, LogLevel} from '../logging';

const randomBytesAsync = promisify(randomBytes);

/**
 * Generates an insecure uid using Math.random
 * @param length
 */
export const uid = (length: number): string => {
    let str = Date.now().toString(32);

    while (str.length < length) {
        const salt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
        str += salt.slice(str.length - length);
    }

    return str;
};

/**
 * Generates a secure number with the length provided.
 * In case the crypto module fails the insecure function is used as fallback and it gets logged as error.
 *
 * @param length
 */
export const secureUid = async (length: number): Promise<string> => {
    if (length < 8) {
        throw new Error('Minimum length for an uid is 8.');
    }

    let str = '';
    while (str.length < length) {
        const [error, next] = await randomBytesAsync((length * 1.5) >>> 0)
            .then(value => [false, value])
            .catch(error => [true, error]);

        if (error) {
            log('failed-rand', {reason: next}, LogLevel.ERROR);
            return uid(length);
        }

        str += next
            .toString('base64')
            .replace(/[+=\/]/g, '');
    }

    return str.substr(0, length);
};

/**
 * Generates 8-digit numbers which can be used as backup codes.
 *
 * @param amount
 */
export const secureBackupCodes = async (amount = 10): Promise<Array<string>> => {
    return randomBytesAsync(amount)
        .then(randomBytes => [...randomBytes].map(v => String(Math.ceil(99999999 * v / 255)).padStart(8, '0')));
};
