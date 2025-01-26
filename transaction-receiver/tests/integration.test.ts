import { describe, it, expect, beforeAll, afterAll } from "vitest";
import amqplib from "amqplib";
import { initializeMessageQueue, publishTransaction } from "../index";

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "transactionPayloads";

describe("Transaction Receiver Microservice", () => {
  let connection: amqplib.Connection;
  let channel: amqplib.Channel;

  beforeAll(async () => {
    // Initialize the message queue
    await initializeMessageQueue();
    //purge the queue
    amqplib.connect(RABBITMQ_URL).then(async (conn) => {
      const ch = await conn.createChannel();
      await ch.purgeQueue(QUEUE_NAME);
    });

    // Connect to RabbitMQ
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
  });

  afterAll(async () => {
    // Close RabbitMQ connection
    await channel.close();
    await connection.close();
  });

  it("should publish a transaction to the RabbitMQ queue", async () => {
    const transaction = {
      accountId: "test-account",
      amount: 100.0,
      currency: "USD",
      timestamp: new Date().toISOString(),
    };

    // Publish the transaction to the RabbitMQ queue
    await publishTransaction(transaction);

    // Wait for 1 second before checking the queue
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Fetch the message from the queue
    const msg = await channel.get(QUEUE_NAME, { noAck: true });

    // Check if the message is in the RabbitMQ queue
    expect(msg).not.toBeNull();
    //expect message not to be false
    expect(msg).not.toBeFalsy();

    if (msg !== false) {
      console.log(msg.content.toString());
      const receivedTransaction = JSON.parse(msg.content.toString());
      expect(receivedTransaction.accountId).toBe(transaction.accountId);
      expect(receivedTransaction.amount).toBe(transaction.amount);
      expect(receivedTransaction.currency).toBe(transaction.currency);
      // Use a more flexible comparison for the timestamp
      expect(receivedTransaction.timestamp).toBe(transaction.timestamp);
    }
  });
});
