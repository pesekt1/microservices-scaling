import axios from "axios";
import { generateAndSendTransactions } from "./index"; // Adjust the import path as needed
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "dotenv/config";

vi.mock("axios");

describe("generateAndSendTransactions", () => {
  const API_URL = process.env.API_URL as string;
  const MESSAGE_SPEED = 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.API_URL = API_URL;
    process.env.MESSAGE_SPEED = MESSAGE_SPEED.toString();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.resetAllMocks();
  });

  it("should send a transaction payload at regular intervals", async () => {
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({ status: 200 });

    generateAndSendTransactions();

    vi.advanceTimersByTime(MESSAGE_SPEED);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      API_URL,
      expect.objectContaining({
        accountId: expect.any(String),
        amount: expect.any(String),
        currency: expect.any(String),
        timestamp: expect.any(String),
      })
    );

    vi.advanceTimersByTime(MESSAGE_SPEED);

    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it("should log an error if the API request fails", async () => {
    const error = new Error("Network Error");
    vi.spyOn(axios, "post").mockRejectedValue(error);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    generateAndSendTransactions();

    vi.advanceTimersByTime(MESSAGE_SPEED);

    // Wait for the promise to be rejected and the error to be logged
    await vi.advanceTimersByTime(MESSAGE_SPEED);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error sending transaction to API:",
      error
    );
  });
});
