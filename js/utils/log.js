const cfg = require(process.cwd() + '/public/js/conf/conf');
const winston = require('winston');
require('winston-daily-rotate-file');

// Dynamically adds new logs handler
let switchersAILogs = {};

/**
 * Write new log entry to console & out stream
 * The type of severity levels are: error, warn, info, verbose, debug, silly
 * Use: logUtil.error / logUtil.warn etc...
 * */
function logObj() {
    if (!(this instanceof logObj)) return new logObj();

    const myFormat = winston.format.combine(
        winston.format.timestamp({
            format: cfg.logs.format
        }),
        winston.format.printf(info => `${info.timestamp}\t${info.level}\t\t${info.message}`)
    );

    let allTransport = new winston.transports.DailyRotateFile({
        filename: cfg.logs.silly.fileName,
        datePattern: cfg.logs.datePattern,
        zippedArchive: false,
        maxSize: cfg.logs.silly.maxSize,
        maxFiles: cfg.logs.silly.maxFiles,
        format: myFormat,
        level: 'silly',
        dirname: cfg.logs.dirPath
    });
    let infoTransport = new winston.transports.DailyRotateFile({
        filename: cfg.logs.info.fileName,
        datePattern: cfg.logs.datePattern,
        zippedArchive: false,
        maxSize: cfg.logs.info.maxSize,
        maxFiles: cfg.logs.info.maxFiles,
        format: myFormat,
        level: 'info',
        dirname: cfg.logs.dirPath
    });
    let warningsTransport = new winston.transports.DailyRotateFile({
        filename: cfg.logs.warn.fileName,
        datePattern: cfg.logs.datePattern,
        zippedArchive: false,
        maxSize: cfg.logs.warn.maxSize,
        maxFiles: cfg.logs.warn.maxFiles,
        format: myFormat,
        level: 'warn',
        dirname: cfg.logs.dirPath
    });
    let errorTransport = new winston.transports.DailyRotateFile({
        filename: cfg.logs.error.fileName,
        datePattern: cfg.logs.datePattern,
        zippedArchive: false,
        maxSize: cfg.logs.error.maxSize,
        maxFiles: cfg.logs.error.maxFiles,
        format: myFormat,
        level: 'error',
        dirname: cfg.logs.dirPath
    });

    this.logger = winston.createLogger({
        transports: [
            allTransport,
            infoTransport,
            warningsTransport,
            errorTransport,
            new winston.transports.Console({
                format: myFormat
            })
        ]
    });
}

const switchersAILog = function (level, pcName, msg) {
    function switchersAILogObj(fileName, level) {
        if (!(this instanceof switchersAILogObj)) return new switchersAILogObj(fileName, level);

        const myFormat = winston.format.combine(
            winston.format.timestamp({
                format: cfg.logs.format
            }),
            winston.format.printf(info => `${info.timestamp}\t${info.level}\t\t${info.message}`)
        );

        let newTransport = new winston.transports.DailyRotateFile({
            filename: fileName,
            datePattern: cfg.logs.datePattern,
            zippedArchive: false,
            maxSize: cfg.logs.switchers_ai.maxSize,
            maxFiles: cfg.logs.switchers_ai.maxFiles,
            format: myFormat,
            level: level,
            dirname: cfg.logs.dirPath
        });
        this.logger = winston.createLogger({
            transports: [
                newTransport
            ]
        });
    }

    if (!switchersAILogs[pcName]) {
        switchersAILogs[pcName] = {};
    }

    if (!switchersAILogs[pcName][level]) {
        let fileName = cfg.logs.switchers_ai.fileName
            .replace('%PC_NAME%', pcName)
            .replace('%LEVEL%', level);

        switchersAILogs[pcName][level] = new switchersAILogObj(fileName, level).logger;
    }

    switchersAILogs[pcName][level].log(level, msg);
};

/**
 * Create one log all over the API
 * @returns {Object} logger object
 * */
let singleton = (function () {
    let instance = undefined;

    return (function () {
        if (instance === undefined) {
            instance = new logObj().logger;
            instance.switchersAILog = switchersAILog;
        }

        return instance;
    });
})();

// Export
module.exports = singleton();