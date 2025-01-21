// Simulates fluctuating speed of sending transactions to the API
// Adjusts the speed every 2 minutes

import express from "express";
import axios from "axios";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT;
const API_URL = process.env.API_URL as string;
const MESSAGE_SPEED = parseInt(process.env.MESSAGE_SPEED as string);
let currentMessageSpeed = MESSAGE_SPEED;
let intervalId: NodeJS.Timeout;

export async function generateAndSendTransactions() {
  try {
    const sendTransaction = async () => {
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
    };

    const adjustMessageSpeed = () => {
      const factor = Math.random() * 0.5 + 0.5; // Random number between 0.5 and 1
      currentMessageSpeed = Math.floor(MESSAGE_SPEED * factor);
      console.log(`Adjusted MESSAGE_SPEED to ${currentMessageSpeed}ms`);

      clearInterval(intervalId);
      intervalId = setInterval(sendTransaction, currentMessageSpeed);
    };

    intervalId = setInterval(sendTransaction, currentMessageSpeed);

    setInterval(adjustMessageSpeed, 2 * 60 * 1000); // Adjust MESSAGE_SPEED every 2 minutes

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
