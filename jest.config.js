module.exports = {
    setupFilesAfterEnv: ['jest-extended'],
    globalTeardown: './tests/teardown.ts',
    transform: {'\.ts$': 'ts-jest'},
    moduleFileExtensions: ['ts', 'js', 'json'],
    testTimeout: 50000
};
