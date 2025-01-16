import express from "express";
import amqplib from "amqplib";
import { Sequelize, DataTypes } from "sequelize";
import "dotenv";

const app = express();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const QUEUE_NAME = process.env.QUEUE_NAME as string;

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: "mysql",
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const Transaction = sequelize.define("Transaction", {
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  processedAt: {
    type: DataTypes.DATE,
  },
});

// for simulating processing delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function startConsumer() {
  try {
    await sequelize.sync({ force: true }); // means drop all tables and recreate them
    console.log("Database synced.");

    const connection = await amqplib.connect(
      process.env.RABBITMQ_URL as string
    );
    const channel = await connection.createChannel();
    await channel.assertQueue(process.env.QUEUE_NAME as string);

    // Limit the number of unacknowledged messages to 1
    channel.prefetch(1);

    channel.consume(
      process.env.QUEUE_NAME as string,
      async (msg) => {
        if (msg) {
          const data = JSON.parse(msg.content.toString());
          console.log("Received:", data);

          // Simulate processing delay
          await delay(3000);

          const processedTransaction = {
            ...data,
            processedAt: new Date(),
          };

          await Transaction.create(processedTransaction);
          console.log("Saved to DB:", processedTransaction);

          channel.ack(msg);
        }
      },
      { noAck: false }
    ); // Ensure manual acknowledgment is enabled

    console.log("Consumer microservice is running...");
  } catch (error) {
    console.error("Error in Consumer microservice:", error);
  }
}

// Call the startConsumer function
startConsumer();

app.listen(PORT, () => {
  console.log(`Consumer service listening on port ${PORT}`);
});
