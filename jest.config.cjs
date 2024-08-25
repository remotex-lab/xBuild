module.exports = {
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                jsc: {
                    transform: {
                        optimizer: {
                            globals: {
                                vars: {
                                    "import.meta.dirname": "'dist'",
                                },
                            },
                        },
                    }
                }
            }
        ],
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!**/*.d.ts',
    ],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    testPathIgnorePatterns: [ '/lib/', '/node_modules/', '/dist/' ],
    transformIgnorePatterns: [
        '/node_modules/(?!@remotex-labs/xmap)',
    ],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
        '^@directives/(.*)$': '<rootDir>/src/directives/$1',
        '^@services/(.*)$': '<rootDir>/src/core/services/$1',
        '^@providers/(.*)$': '<rootDir>/src/core/providers/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
    },
    resetMocks: true,
    resetModules: true,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
