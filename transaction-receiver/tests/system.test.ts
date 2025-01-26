import { describe, it, expect, beforeAll, afterAll } from "vitest";
import amqplib from "amqplib";
import { initializeMessageQueue, publishTransaction } from "../index";

const RABBITMQ_URL = "amqp://localhost";
const QUEUE_NAME = "transactionPayloads";
const ACCEPTED_QUEUE_NAME = "acceptedTransactions";
const SUSPICIOUS_QUEUE_NAME = "suspiciousTransactions";

describe("System test between receiver and fraud detection", () => {
  let connection: amqplib.Connection;
  let channel: amqplib.Channel;

  beforeAll(async () => {
    // Initialize the message queue
    // await initializeMessageQueue();
    // Connect to RabbitMQ
    process.env.PORT = "30011";
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Purge the queues and assert them
    await channel.assertQueue(QUEUE_NAME);
    await channel.assertQueue(ACCEPTED_QUEUE_NAME);
    await channel.assertQueue(SUSPICIOUS_QUEUE_NAME);
    await channel.purgeQueue(QUEUE_NAME);
    await channel.purgeQueue(ACCEPTED_QUEUE_NAME);
    await channel.purgeQueue(SUSPICIOUS_QUEUE_NAME);
  });

  afterAll(async () => {
    // Close RabbitMQ connection
    await channel.close();
    await connection.close();
  });

  it("message published by the receiver should be consumed by fraud-detection and published to one of the 2 queues.", async () => {
    const transaction = {
      accountId: "test-account",
      amount: 200.0,
      currency: "EUR",
      timestamp: new Date().toISOString(),
    };

    // Publish the transaction to the RabbitMQ queue
    await publishTransaction(transaction);

    // Wait for 1 second before checking the queue
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if the message is in one of the two queues
    const msgAccepted = await channel.get(ACCEPTED_QUEUE_NAME, { noAck: true });

    const msgSuspicious = await channel.get(SUSPICIOUS_QUEUE_NAME, {
      noAck: true,
    });

    // Check if the message is in one of the two queues
    expect(msgAccepted || msgSuspicious).not.toBeNull();
    //expect message not to be false
    expect(msgAccepted || msgSuspicious).not.toBeFalsy();

    if (msgAccepted !== false) {
      console.log(msgAccepted.content.toString());
      const receivedTransaction = JSON.parse(msgAccepted.content.toString());
      expect(receivedTransaction.accountId).toBe(transaction.accountId);
      expect(receivedTransaction.amount).toBe(transaction.amount);
      expect(receivedTransaction.currency).toBe(transaction.currency);
      // Use a more flexible comparison for the timestamp
      expect(receivedTransaction.timestamp).toBe(transaction.timestamp);
    }

    if (msgSuspicious !== false) {
      console.log(msgSuspicious.content.toString());
      const receivedTransaction = JSON.parse(msgSuspicious.content.toString());
      expect(receivedTransaction.accountId).toBe(transaction.accountId);
      expect(receivedTransaction.amount).toBe(transaction.amount);
      expect(receivedTransaction.currency).toBe(transaction.currency);
      // Use a more flexible comparison for the timestamp
      expect(receivedTransaction.timestamp).toBe(transaction.timestamp);
    }
  });
});
