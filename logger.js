const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const fs = require('fs');
const path = require('path');

// Crear la carpeta "logs" si no existe
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const infoLogger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDir, 'infoLogger.log') })
    ]
});

const errorLogger = createLogger({
    level: 'error',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDir, 'errorLogger.log') })
    ]
});

module.exports = { infoLogger, errorLogger };
