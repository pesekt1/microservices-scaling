import express from "express";
import amqplib from "amqplib";
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
});
