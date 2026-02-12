import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll } from "vitest";

// Suppress console.error in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("[TEST]")) {
      originalError(...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});
