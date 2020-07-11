module.exports = {
    setupFilesAfterEnv: ['jest-extended'],
    transform: {'\.ts$': 'ts-jest'},
    moduleFileExtensions: ['ts', 'js', 'json'],
    testTimeout: 50000
};
