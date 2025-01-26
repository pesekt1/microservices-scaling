import winston from "winston";
import path from "path";

// Define log file path
const logFilePath = "/var/log/transaction-receiver/microservice.log";

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

export default logger;
