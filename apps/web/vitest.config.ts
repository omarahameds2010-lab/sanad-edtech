import { defineConfig } from "vitest/config";

// Single Vitest config for the web app (node-only unit tests:
// API client, hooks, countdown). Ex-storybook browser config was
// removed 2026-10-09: it required @storybook/addon-vitest +
// Playwright, neither of which is a dependency of this workspace.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/lib/**/*.test.ts"],
  },
});
