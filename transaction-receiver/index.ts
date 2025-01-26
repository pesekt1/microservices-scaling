import express from "express";
import amqplib from "amqplib";
import logger from "./logger";
import "dotenv/config";

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const QUEUE_NAME = process.env.QUEUE_NAME as string;

let channel: amqplib.Channel;

export async function initializeMessageQueue() {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
    console.log("Connected to RabbitMQ and queue asserted!");

    console.log("Transaction receiver service is running...");
  } catch (error) {
    console.error("RabbitMQ error:", error);
  }
}

export async function publishTransaction(transaction: any) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(transaction)));
  console.log("Sent:", transaction);
}

// API endpoint to receive transactions and send them to the queue
app.post("/transactions", async (req, res) => {
  const { accountId, amount, currency, timestamp } = req.body;

  if (!accountId || !amount || !currency || !timestamp) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const dataPacket = {
      accountId,
      amount,
      currency,
      timestamp,
    };

    await publishTransaction(dataPacket);

    res.status(200).send("Transaction sent to the queue");
  } catch (error) {
    console.error("Error sending transaction to the queue:", error);
    res.status(500).send("Error sending transaction to the queue");
  }
});

initializeMessageQueue().catch((err) => {
  console.error("Error in Transaction receiver service:", err);
});

app.listen(PORT, () => {
  console.log(`Transaction receiver service listening on port ${PORT}`);

  logger.info("Microservice started successfully.", {
    service: "transaction-receiver",
  });

  try {
    logger.info("Processing a transaction...", {
      service: "transaction-receiver",
    });

    // Simulate successful transaction
    const result = 10 / 2;
    logger.info(`Transaction processed successfully: Result = ${result}`, {
      service: "transaction-receiver",
    });

    // Simulate an error
    logger.info("Processing another transaction...", {
      service: "transaction-receiver",
    });
    throw new Error("Simulated error"); // Simulate an error
  } catch (error) {
    logger.error(`Exception occurred: ${(error as Error).message}`, {
      service: "transaction-receiver",
      stack: (error as Error).stack,
    });
  }

  logger.warn("This is a warning.", { service: "transaction-receiver" });
  logger.debug("This is a debug message.", { service: "transaction-receiver" });
});
