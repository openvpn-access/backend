import {secureBackupCodes, secureUid, uid} from '../../src/utils/uid';

describe('UID Utility', () => {

    it('Should generate 10.000 insecure uid\'s with random length', () => {
        for (let i = 0; i < 10000; i++) {
            const length = Math.ceil(Math.random() * 50) + 8;
            expect(uid(length)).toHaveLength(length);
        }
    });

    it('Should generate 10.000 secure uid\'s with random length', async () => {
        for (let i = 0; i < 10000; i++) {
            const length = Math.ceil(Math.random() * 50) + 8;
            expect(await secureUid(length)).toHaveLength(length);
        }
    });

    it('Should generate 10.000 backup codes', async () => {
        for (let i = 0; i < 10000; i++) {
            const amount = Math.ceil(Math.random() * 50);
            const codes = await secureBackupCodes(amount);
            expect(codes).toHaveLength(amount);

            for (const code of codes) {
                expect(code).toHaveLength(8);
            }
        }
    });
});
