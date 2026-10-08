import { defineConfig } from "vitest/config";

// Lightweight unit-test project for web app logic (API client, hooks).
// Storybook browser tests keep using vitest.config.ts; this config is
// node-only so `pnpm test` stays fast and dependency-free.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/lib/**/*.test.ts"],
  },
});
