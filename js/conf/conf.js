const jPackage = require(process.cwd() + '/package.json');

const conf = {};

conf.prod = {
    // Project
    project: {
        name: jPackage.name,
        description: jPackage.description,
        version: jPackage.version,
        build: 'release',
        loadedAt: new Date().getTime()
    },

    logs: {
        format: 'YYYY-MM-DD HH:mm:ss',
        datePattern: 'YYYY-MM-DD',
        dirPath: 'logs',
        silly: {
            fileName: 'switchers.ai-silly-%DATE%.log',
            maxSize: '20m',
            maxFiles: '7d'
        },
        info: {
            fileName: 'switchers.ai-info-%DATE%.log',
            maxSize: '20m',
            maxFiles: '14d'
        },
        warn: {
            fileName: 'switchers.ai-warn-%DATE%.log',
            maxSize: '20m',
            maxFiles: '14d'
        },
        error: {
            fileName: 'switchers.ai-error-%DATE%.log',
            maxSize: '20m',
            maxFiles: '14d'
        },
        switchers_ai: {
            fileName: 'switchers_ai-%LEVEL%-%PC_NAME%-%DATE%.log',
            maxSize: '20m',
            maxFiles: '14d'
        }
    }
};

module.exports = conf.prod;