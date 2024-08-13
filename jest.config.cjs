module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': [ '@swc/jest' ],
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!**/*.d.ts',
    ],
    testPathIgnorePatterns: [ '/lib/', '/node_modules/', '/dist/' ],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
        '^@providers/(.*)$': '<rootDir>/src/core/providers/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
    },
};
