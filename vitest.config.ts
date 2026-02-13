import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: [
            "src/lib/**/*.test.ts",
            "src/app/api/**/*.test.ts",
            "src/middleware.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          include: [
            "src/hooks/**/*.test.{ts,tsx}",
            "src/components/**/*.test.{ts,tsx}",
            "src/contexts/**/*.test.{ts,tsx}",
            "src/app/**/*.test.{ts,tsx}",
            "src/types/**/*.test.ts",
          ],
          exclude: ["src/app/api/**"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["**/__tests__/**", "**/*.test.*"],
    },
  },
});
