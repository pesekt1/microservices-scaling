import winston from "winston";
import path from "path";

// Define log file path
//const logFilePath = "/var/log/transaction-receiver/microservice.log";

// Define log file path using path.join
const logFilePath = path.join(
  "/var",
  "log",
  "transaction-receiver",
  "microservice.log"
);

// Configure winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // JSON format for structured logs
  ),
  transports: [
    // Write logs to a file (this matches the mounted volume)
    new winston.transports.File({ filename: logFilePath }),

    // Output logs to stdout for Promtail scraping
    new winston.transports.Console(),
  ],
});

/**
 * Utility function to log to both console and Winston logger with dynamic log levels.
 * @param message - The log message
 * @param options - Additional options for logging (level and metadata)
 */
function logMessage(
  message: string,
  options: { level?: string; meta?: Record<string, any> } = {}
): void {
  const { level = "info", meta = {} } = options;

  // Log to the console
  console.log(`[${level.toUpperCase()}] ${message}`);

  // Log to Winston with the specified log level
  logger.log(level, message, meta);
}

// Export both the logger and logMessage function
export { logger, logMessage };
