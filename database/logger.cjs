const winston = require('winston');
const path = require('path');
const fs = require('fs');

const env = process.env.CONTEXTO_DE_LOGGING || (process.env.NODE_ENV === 'production' ? 'production' : 'development');
const level = env === 'development' ? 'debug' : 'info';

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

let _logger = null;

function createLogger(logsDir) {
  const transports = [];

  if (env === 'development') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  if (logsDir) {
    fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'structured.log'),
        level: 'info',
        format: baseFormat
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'errors.log'),
        level: 'error',
        format: baseFormat
      })
    );
  }

  return winston.createLogger({
    level,
    format: baseFormat,
    exitOnError: false,
    transports
  });
}

function initLogger(logsDir) {
  _logger = createLogger(logsDir);
}

_logger = createLogger(null);

function getLogger() {
  return _logger;
}

module.exports = { initLogger, logger: getLogger };
