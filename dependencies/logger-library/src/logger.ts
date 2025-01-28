import winston from "winston";
import path from "path";

export function createLogger(serviceName: string) {
  const logFilePath = path.join("/var", "log", serviceName, "microservice.log");

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: logFilePath }),
      new winston.transports.Console(),
    ],
  });

  function logMessage(
    message: string,
    options: { level?: string; meta?: Record<string, any> } = {}
  ): void {
    const { level = "info", meta = {} } = options;
    logger.log(level, message, { service: serviceName, ...meta });
  }

  return { logger, logMessage };
}
