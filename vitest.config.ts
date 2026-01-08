import { defineConfig, configDefaults, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as unknown as Plugin],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    environmentMatchGlobs: [["tests/server/**/*.test.ts", "node"]],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "tests/**",
        "*.config.{ts,js,cjs}",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  build: {
    sourcemap: false,
  },
});
