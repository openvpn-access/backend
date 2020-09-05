import {omit, pick} from '../../src/utils/pick';

describe('Pick Utility', () => {

    it('Should pick properties from an object using .pick', () => {
        expect(pick({
            a: 12,
            b: 223,
            c: 12
        }, 'a', 'b')).toEqual({
            a: 12,
            b: 223
        });
    });

    it('Should omit properties from an object using .omit', () => {
        expect(omit({
            a: 12,
            b: 223,
            c: 12
        }, 'a', 'b')).toEqual({
            c: 12
        });
    });
});
