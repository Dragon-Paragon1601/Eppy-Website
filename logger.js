const winston = require("winston");
const path = require("path");
const fs = require("fs");
const DailyRotateFile = require("winston-daily-rotate-file");

const logDir = path.join(__dirname, "logs");
const archiveDir = path.join(logDir, "archive");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

const logFolders = ["error", "warn"];
logFolders.forEach((folder) => {
  const archivePath = path.join(archiveDir, folder);
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
  }
});

const logger = winston.createLogger({
  level: "warn",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "warn.log"),
      level: "warn",
    }),
    new DailyRotateFile({
      filename: path.join(archiveDir, "error", "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "1m",
      maxFiles: "7d",
      zippedArchive: false,
    }),
    new DailyRotateFile({
      filename: path.join(archiveDir, "warn", "warn-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "warn",
      maxSize: "1m",
      maxFiles: "7d",
      zippedArchive: false,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),
      ),
    }),
  ],
});

console.log = (message, ...args) => {
  logger.info(`${message} ${args.join(" ")}`);
};
console.info = (message, ...args) => {
  logger.info(`${message} ${args.join(" ")}`);
};
console.error = (message, ...args) => {
  logger.error(`${message} ${args.join(" ")}`);
};
console.warn = (message, ...args) => {
  logger.warn(`${message} ${args.join(" ")}`);
};
console.debug = (message, ...args) => {
  logger.debug(`${message} ${args.join(" ")}`);
};

module.exports = logger;
