import express from "express";
import amqplib from "amqplib";
import { faker } from "@faker-js/faker";
import createLogger from "@microservices-demo/logger-library";
import "dotenv/config";

const { logMessage } = createLogger("fraud-detection");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const INPUT_QUEUE_NAME = process.env.INPUT_QUEUE_NAME as string;
const ACCEPTED_QUEUE_NAME = process.env.ACCEPTED_QUEUE_NAME as string;
const SUSPICIOUS_QUEUE_NAME = process.env.SUSPICIOUS_QUEUE_NAME as string;
const MESSAGE_PROCESSING_SPEED = parseInt(
  process.env.MESSAGE_PROCESSING_SPEED as string
);

let channel: amqplib.Channel;

export async function connectToRabbitMQ() {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    logMessage("Connected to RabbitMQ!", {
      level: "info",
    });
  } catch (error) {
    logMessage(`RabbitMQ connection error: ${(error as Error).message}`, {
      level: "error",
    });
    throw error;
  }
}

export async function assertQueues() {
  try {
    await channel.assertQueue(INPUT_QUEUE_NAME);
    await channel.assertQueue(ACCEPTED_QUEUE_NAME);
    await channel.assertQueue(SUSPICIOUS_QUEUE_NAME);
    logMessage("Queues asserted!", {
      level: "info",
    });
  } catch (error) {
    logMessage(`Queue assertion error: ${(error as Error).message}`, {
      level: "error",
    });
    throw error;
  }
}

// for simulating processing delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function consumeMessages() {
  try {
    // Limit the number of unacknowledged messages to 1, otherwise the delay will not work
    channel.prefetch(1);

    channel.consume(
      INPUT_QUEUE_NAME,
      async (msg) => {
        if (msg) {
          const data = JSON.parse(msg.content.toString());
          logMessage("Received message", {
            level: "info",
            meta: { data },
          });

          // Simulate processing delay
          await delay(MESSAGE_PROCESSING_SPEED);

          // Simulate fraud detection
          const isSuspicious = Math.random() < 0.05; // 5% chance of being suspicious

          if (isSuspicious) {
            const suspiciousData = {
              ...data,
              flaggedAt: new Date().toISOString(),
              reason: faker.lorem.paragraphs(2), // Generate a long random description
            };

            channel.sendToQueue(
              SUSPICIOUS_QUEUE_NAME,
              Buffer.from(JSON.stringify(suspiciousData))
            );
            logMessage("Sent to suspicious queue", {
              level: "info",
            });
          } else {
            channel.sendToQueue(
              ACCEPTED_QUEUE_NAME,
              Buffer.from(JSON.stringify(data))
            );
            logMessage("Sent to approved queue", {
              level: "info",
            });
          }

          channel.ack(msg);
        }
      },
      { noAck: false } // Ensure manual acknowledgment is enabled otherwise the delay will not work
    );
  } catch (error) {
    logMessage(`Message consumption error: ${(error as Error).message}`, {
      level: "error",
    });
    throw error;
  }
}

async function initializeMessageQueue() {
  await connectToRabbitMQ();
  await assertQueues();
  await consumeMessages();
}

initializeMessageQueue().catch((err) => {
  logMessage(`Error in Fraud detection service: ${(err as Error).message}`, {
    level: "error",
  });
});

app.listen(PORT, () => {
  logMessage(`Fraud detection service listening on port ${PORT}`, {
    level: "info",
  });
});
