import express from "express";
import amqplib from "amqplib";
import createLogger from "@microservices-demo/logger-library";
import "dotenv/config";

const { logMessage } = createLogger("transaction-receiver");

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
    logMessage("Connected to RabbitMQ and queue asserted!", {
      level: "info",
    });
  } catch (error) {
    logMessage(`RabbitMQ error: ${(error as Error).message}`, {
      level: "error",
    });
  }
}

export async function publishTransaction(transaction: any) {
  try {
    if (!channel) {
      const errorMessage = "RabbitMQ channel is not initialized";
      logMessage(errorMessage, {
        level: "error",
      });
      throw new Error(errorMessage);
    }

    // Attempt to send the transaction to the queue
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(transaction)));

    logMessage("Transaction sent to the queue successfully", {
      level: "info",
    });
  } catch (error) {
    // Log the error and rethrow it for upstream handling
    logMessage(`Failed to publish transaction: ${(error as Error).message}`, {
      level: "error",
      meta: { transaction },
    });
    throw error;
  }
}

// API endpoint to receive transactions and send them to the queue
app.post("/transactions", async (req, res) => {
  const { accountId, amount, currency, timestamp } = req.body;

  if (!accountId || !amount || !currency || !timestamp) {
    const errorMessage = "Missing required fields";
    logMessage(errorMessage, {
      level: "error",
    });
    return res.status(400).send(errorMessage);
  }

  try {
    const dataPacket = {
      accountId,
      amount,
      currency,
      timestamp,
    };

    await publishTransaction(dataPacket);
    res.status(200).send("Transaction received and sent to the queue");
  } catch (error) {
    const errorMessage = `Error sending transaction to the queue: ${
      (error as Error).message
    }`;
    res.status(500).send(errorMessage);
  }
});

initializeMessageQueue();

app.listen(PORT, () => {
  logMessage(`Transaction receiver service listening on port ${PORT}`, {
    level: "info",
  });
});
