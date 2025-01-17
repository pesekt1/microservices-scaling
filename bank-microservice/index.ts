import express from "express";
import amqplib from "amqplib";
import { faker } from "@faker-js/faker";
import "dotenv";

const app = express();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const QUEUE_NAME = process.env.QUEUE_NAME as string;
const MESSAGE_SPEED = parseInt(process.env.MESSAGE_SPEED as string);

async function startProducer() {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
    console.log("Connected to RabbitMQ and queue asserted");

    // Send a message every MESSAGE_SPEED milliseconds
    setInterval(() => {
      const dataPacket = {
        accountId: faker.string.uuid(),
        amount: faker.finance.amount(),
        currency: faker.finance.currencyCode(),
        timestamp: new Date().toISOString(),
      };

      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(dataPacket)));
      console.log("Sent:", dataPacket);
    }, MESSAGE_SPEED);

    console.log("Bank service is running...");
  } catch (error) {
    console.error("RabbitMQ error:", error);
  }
}

startProducer().catch((err) => {
  console.error("Error in Bank service:", err);
});

app.listen(PORT, () => {
  console.log(`Bank service listening on port ${PORT}`);
});
