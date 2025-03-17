const winston = require("winston");

// Tworzenie loggera
const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// Nadpisanie metod console
const originalConsoleLog = console.log;
console.log = (...args) => {
  logger.info(...args); // Przekierowanie do loggera
  originalConsoleLog(...args); // Wywołanie oryginalnego console.log
};

const originalConsoleError = console.error;
console.error = (...args) => {
  logger.error(...args); // Przekierowanie błędów do loggera
  originalConsoleError(...args); // Wywołanie oryginalnego console.error
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  logger.warn(...args); // Przekierowanie ostrzeżeń do loggera
  originalConsoleWarn(...args); // Wywołanie oryginalnego console.warn
};

const originalConsoleInfo = console.info;
console.info = (...args) => {
  logger.info(...args); // Przekierowanie info do loggera
  originalConsoleInfo(...args); // Wywołanie oryginalnego console.info
};

module.exports = logger;
