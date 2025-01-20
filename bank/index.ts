import express from "express";
import axios from "axios";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT;
const API_URL = process.env.API_URL as string;
const MESSAGE_SPEED = parseInt(process.env.MESSAGE_SPEED as string);

async function generateAndSendTransactions() {
  try {
    // Send a message every MESSAGE_SPEED milliseconds
    setInterval(async () => {
      const transactionPayload = {
        accountId: faker.string.uuid(),
        amount: faker.finance.amount(),
        currency: faker.finance.currencyCode(),
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await axios.post(API_URL, transactionPayload);
        console.log("Sent:", transactionPayload, "Response:", response.status);
      } catch (error) {
        console.error("Error sending transaction to API:", error);
      }
    }, MESSAGE_SPEED);

    console.log("Bank service is running...");
  } catch (error) {
    console.error("Error in Bank service:", error);
  }
}

generateAndSendTransactions().catch((err) => {
  console.error("Error in Bank service:", err);
});

app.listen(PORT, () => {
  console.log(`Bank service listening on port ${PORT}`);
});
