import express from "express";
import amqplib from "amqplib";
import { Sequelize, DataTypes } from "sequelize";
import createLogger from "@microservices-demo/logger-library";

import "dotenv";

const { logMessage } = createLogger("transaction-processing");

const app = express();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL as string;
const QUEUE_NAME = process.env.QUEUE_NAME as string;
const MESSAGE_PROCESSING_SPEED = parseInt(
  process.env.MESSAGE_PROCESSING_SPEED as string
);

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: "mysql",
});

sequelize
  .authenticate()
  .then(() => {
    logMessage("Connection has been established successfully.", {
      level: "info",
    });
  })
  .catch((err) => {
    logMessage("Unable to connect to the database.", {
      level: "error",
      meta: { error: err },
    });
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

async function processing() {
  try {
    await sequelize.sync();
    //await sequelize.sync({ force: true }); // means drop all tables and recreate them
    logMessage("Database synced.", {
      level: "info",
    });

    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);

    // Limit the number of unacknowledged messages to 1, otherwise the delay will not work
    channel.prefetch(1);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg) {
          const data = JSON.parse(msg.content.toString());
          logMessage("Received message", {
            level: "info",
            meta: { data },
          });

          // Simulate processing delay
          await delay(MESSAGE_PROCESSING_SPEED);

          const processedTransaction = {
            ...data,
            processedAt: new Date(),
          };

          await Transaction.create(processedTransaction);
          logMessage("Saved to DB", {
            level: "info",
            meta: { processedTransaction },
          });

          channel.ack(msg);
        }
      },
      { noAck: false }
    ); // Ensure manual acknowledgment is enabled
  } catch (error) {
    logMessage(`Transaction processing error: ${(error as Error).message}`, {
      level: "error",
    });
  }
}

// Call the processing function
processing();

app.listen(PORT, () => {
  logMessage(`Transaction processing service listening on port ${PORT}`, {
    level: "info",
  });
});
