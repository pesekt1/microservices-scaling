import express from "express";
import amqplib from "amqplib";
import "dotenv/config";

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const INPUT_QUEUE_NAME = process.env.INPUT_QUEUE_NAME as string;
const ACCEPTED_QUEUE_NAME = process.env.ACCEPTED_QUEUE_NAME as string;
const SUSPICIOUS_QUEUE_NAME = process.env.SUSPICIOUS_QUEUE_NAME as string;

async function initializeMessageQueue() {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(INPUT_QUEUE_NAME);
    await channel.assertQueue(ACCEPTED_QUEUE_NAME);
    await channel.assertQueue(SUSPICIOUS_QUEUE_NAME);
    console.log("Connected to RabbitMQ and queues asserted!");

    // Consume messages from the INPUT_QUEUE
    channel.consume(INPUT_QUEUE_NAME, async (msg) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        console.log("Received:", data);

        // Simulate fraud detection
        const isSuspicious = Math.random() < 0.05; // 5% chance of being suspicious

        if (isSuspicious) {
          channel.sendToQueue(
            SUSPICIOUS_QUEUE_NAME,
            Buffer.from(JSON.stringify(data))
          );
          console.log("Sent to suspicious queue:", data);
        } else {
          channel.sendToQueue(
            ACCEPTED_QUEUE_NAME,
            Buffer.from(JSON.stringify(data))
          );
          console.log("Sent to approved queue:", data);
        }

        channel.ack(msg);
      }
    });

    console.log("Fraud detection service is running...");
  } catch (error) {
    console.error("RabbitMQ error:", error);
  }
}

initializeMessageQueue().catch((err) => {
  console.error("Error in Fraud detection service:", err);
});

app.listen(PORT, () => {
  console.log(`Fraud detection service listening on port ${PORT}`);
});
